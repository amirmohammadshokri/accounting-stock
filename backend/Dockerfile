FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Accounting.Api/Accounting.Api.csproj Accounting.Api/
COPY Accounting.Application/Accounting.Application.csproj Accounting.Application/
COPY Accounting.Domain/Accounting.Domain.csproj Accounting.Domain/
COPY Accounting.Infrastructure/Accounting.Infrastructure.csproj Accounting.Infrastructure/
RUN dotnet restore Accounting.Api/Accounting.Api.csproj

COPY Accounting.Api/ Accounting.Api/
COPY Accounting.Application/ Accounting.Application/
COPY Accounting.Domain/ Accounting.Domain/
COPY Accounting.Infrastructure/ Accounting.Infrastructure/

RUN dotnet publish Accounting.Api/Accounting.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r accounting && useradd -r -g accounting accounting
COPY --from=build /app .
RUN chown -R accounting:accounting /app
USER accounting

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "Accounting.Api.dll"]
