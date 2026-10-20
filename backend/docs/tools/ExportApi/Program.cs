extern alias ApiAssembly;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Writers;
using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using MediatR;

// Isolated host: Testing skips migration and seeding. No database is accessed.
Environment.SetEnvironmentVariable("ConnectionStrings__Default", "Server=unused;Database=unused;");
Environment.SetEnvironmentVariable("JwtSettings__Secret", "api-documentation-only-placeholder-secret-32-chars");
Environment.SetEnvironmentVariable("JwtSettings__Issuer", "AccountingApi");
Environment.SetEnvironmentVariable("JwtSettings__Audience", "AccountingClient");
Environment.SetEnvironmentVariable("Seeding__Enabled", "false");
using var factory = new DocsFactory();
var services = factory.Services;
var swagger = services.GetRequiredService<ISwaggerProvider>().GetSwagger("v1");
swagger.Servers = [new OpenApiServer { Url = "https://localhost:7000", Description = "Local HTTPS; replace with your backend origin" }];
swagger.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" };
var generator = services.GetRequiredService<ISchemaGenerator>();
var repository = new SchemaRepository();
foreach (var schema in swagger.Components.Schemas) repository.Schemas.Add(schema.Key, schema.Value);
var root = Path.GetFullPath(args[0]);
var output = Path.GetFullPath(args[1]);
Directory.CreateDirectory(output);
var types = typeof(Accounting.Application.Invoices.Queries.Print.GetInvoicePdfQuery).Assembly.GetTypes();
var descriptions = services.GetRequiredService<IApiDescriptionGroupCollectionProvider>().ApiDescriptionGroups.Items.SelectMany(x => x.Items);
foreach (var description in descriptions)
{
    var path = "/" + description.RelativePath!.Split('?')[0];
    if (!swagger.Paths.TryGetValue(path, out var item) || !Enum.TryParse<OperationType>(description.HttpMethod, true, out var verb) || !item.Operations.TryGetValue(verb, out var operation)) continue;
    if (description.ActionDescriptor is not ControllerActionDescriptor action) continue;
    operation.OperationId = action.ControllerName + "_" + action.ActionName;
    var metadata = description.ActionDescriptor.EndpointMetadata;
    var anonymous = metadata.OfType<IAllowAnonymous>().Any();
    var policies = metadata.OfType<IAuthorizeData>().Select(x => x.Policy).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToArray();
    operation.Extensions["x-permissions"] = new OpenApiArray();
    foreach (var policy in policies) ((OpenApiArray)operation.Extensions["x-permissions"]).Add(new OpenApiString(policy));
    if (anonymous) operation.Security = [];
    operation.Description = anonymous ? "Anonymous endpoint." : "Requires JWT Bearer authentication. Permissions: " + string.Join(", ", policies);
    operation.Extensions["x-anonymous"] = new OpenApiBoolean(anonymous);

    if (path.EndsWith("/pdf"))
    {
        operation.Responses["200"] = new OpenApiResponse { Description = "PDF file; no-store. Complete company/contact identity fields first.", Content = { ["application/pdf"] = new OpenApiMediaType { Schema = new OpenApiSchema { Type = "string", Format = "binary" } } } };
        continue;
    }
    // Fill response schemas omitted by IActionResult methods, using their CQRS contract.
    var source = Path.Combine(root, "Controllers", action.ControllerTypeInfo.Name + ".cs");
    if (!File.Exists(source)) continue;
    var method = CSharpSyntaxTree.ParseText(File.ReadAllText(source)).GetRoot().DescendantNodes().OfType<MethodDeclarationSyntax>().FirstOrDefault(x => x.Identifier.Text == action.MethodInfo.Name);
    if (method == null) continue;
    var calls = method.DescendantNodes().OfType<InvocationExpressionSyntax>().ToList();
    if (calls.Any(x => x.Expression.ToString() == "NoContent") && !calls.Any(x => x.Expression.ToString() == "Ok"))
    {
        operation.Responses.Remove("200");
        operation.Responses["204"] = new OpenApiResponse { Description = "No content" };
        continue;
    }
    var created = calls.FirstOrDefault(x => x.Expression.ToString() == "CreatedAtAction");
    if (created != null && operation.Responses.Remove("200", out var createdResponse)) operation.Responses["201"] = createdResponse;
    if (created?.ArgumentList.Arguments.Last().Expression is AnonymousObjectCreationExpressionSyntax)
    {
        operation.Responses["201"] = new OpenApiResponse { Description = "Created identifier", Content = { ["application/json"] = new OpenApiMediaType { Schema = new OpenApiSchema { Type = "object", Properties = { ["id"] = new OpenApiSchema { Type = "integer", Format = "int32" } } } } } };
        continue;
    }
    var fileCall = calls.FirstOrDefault(x => x.Expression.ToString() == "File");
    if (fileCall != null)
    {
        var mime = (fileCall.ArgumentList.Arguments.ElementAtOrDefault(1)?.Expression as LiteralExpressionSyntax)?.Token.ValueText ?? "application/octet-stream";
        operation.Responses["200"] = new OpenApiResponse { Description = "Downloadable file", Content = { [mime] = new OpenApiMediaType { Schema = new OpenApiSchema { Type = "string", Format = "binary" } } } };
        continue;
    }
    Type? result = null;
    if (action.ControllerName == "Auth" && calls.Any(x => x.Expression.ToString() == "MapToAuthResponse")) result = typeof(ApiAssembly::Accounting.Api.Contracts.Authentication.AuthResponse);
    foreach (var typeName in method.DescendantNodes().OfType<ObjectCreationExpressionSyntax>().Select(x => x.Type.ToString()).Concat(action.MethodInfo.GetParameters().Select(x => x.ParameterType.Name)))
    {
        if (result != null) break;
        var type = types.FirstOrDefault(x => x.Name == typeName.Split('.').Last());
        result = type?.GetInterfaces().FirstOrDefault(x => x.IsGenericType && x.GetGenericTypeDefinition() == typeof(IRequest<>))?.GetGenericArguments()[0];
    }
    if (result == null || result == typeof(MediatR.Unit)) continue;
    var success = operation.Responses.FirstOrDefault(x => x.Key is "200" or "201");
    if (success.Value == null) continue;
    if (success.Value.Content.Values.Any(x => x.Schema != null)) continue;
    success.Value.Content["application/json"] = new OpenApiMediaType { Schema = generator.GenerateSchema(result, repository) };
}
foreach (var entry in repository.Schemas) swagger.Components.Schemas[entry.Key] = entry.Value;
swagger.Paths["/health"] = new OpenApiPathItem
{
    Operations = { [OperationType.Get] = new OpenApiOperation
    {
        OperationId = "Health_Check", Tags = [new OpenApiTag { Name = "Health" }], Security = [],
        Description = "Infrastructure health check, including database availability.",
        Responses = { ["200"] = new OpenApiResponse { Description = "Healthy", Content = { ["text/plain"] = new OpenApiMediaType { Schema = new OpenApiSchema { Type = "string" } } } },
            ["503"] = new OpenApiResponse { Description = "Unhealthy" } }
    } }
};
using var writer = new StringWriter();
swagger.SerializeAsV3(new OpenApiJsonWriter(writer));
var json = System.Text.Json.Nodes.JsonNode.Parse(writer.ToString())!;
foreach (var path in json["paths"]!.AsObject())
    foreach (var operation in path.Value!.AsObject())
        if (operation.Value?["x-anonymous"]?.GetValue<bool>() == true || path.Key == "/health")
            operation.Value!["security"] = new System.Text.Json.Nodes.JsonArray();
await File.WriteAllTextAsync(Path.Combine(output, "accounting-openapi.json"), json.ToJsonString(new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
Console.WriteLine($"Exported {swagger.Paths.Sum(x => x.Value.Operations.Count)} operations, {swagger.Components.Schemas.Count} schemas.");

sealed class DocsFactory : WebApplicationFactory<ApiAssembly::Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseContentRoot(Directory.GetCurrentDirectory());
    }
}
