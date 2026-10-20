using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;

foreach (var path in Directory.GetFiles(args[0], "*.dll"))
{
    using var stream = File.OpenRead(path);
    using var pe = new PEReader(stream);
    if (!pe.HasMetadata) continue;
    var metadata = pe.GetMetadataReader();
    Console.WriteLine(Path.GetFileName(path) + " " + metadata.GetAssemblyDefinition().Version);
    foreach (var reference in metadata.AssemblyReferences)
    {
        var assembly = metadata.GetAssemblyReference(reference);
        var name = metadata.GetString(assembly.Name);
        if (!name.StartsWith("System.") && !name.StartsWith("Microsoft.Win32") || name == "System.Drawing.Common")
            Console.WriteLine("  " + name + " " + assembly.Version);
    }
}
