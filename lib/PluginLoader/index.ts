import { SemVer, satisfies, Range } from "semver";
import chalk from "chalk";

interface PluginManifest {
    name: string,
    version: SemVer | string,
    dependencies: PluginDependencies,
    pluginPath?: string
}

interface PluginDependencies {
    [pluginName: string]: {
        version: Range | string,
        optional?: boolean
    }
}

async function getPluginManifest(pluginName: string, pluginPath: string) {
    const manifest = await import(`${pluginPath}/${pluginName}/plugin.json`);
    manifest.version = new SemVer(manifest.version);
    if (validateManifest(manifest)) {
        return manifest;
    }
    throw "Invalid manifest file";
}

// TODO: validate manifest file
function validateManifest(manifest: PluginManifest) {
    return true;
}

async function checkDependencies(manifest: PluginManifest, pluginPath: string, enabledPlugins: Map<string, PluginManifest>) {
    for (const dependency of Object.keys(manifest.dependencies)) {
        if (!enabledPlugins.has(dependency)) {
            // Load dependency
            const depManifest = await getPluginManifest(dependency, pluginPath);
            if (satisfies(depManifest.version, manifest.dependencies[dependency].version)) {
                if (depManifest.dependencies) {
                    checkDependencies(depManifest, pluginPath, enabledPlugins);
                }
                enabledPlugins.set(dependency, depManifest);
            } else if (!manifest.dependencies[dependency].optional) {
                console.error(`Dependency not met for ${dependency}: expected ${manifest.dependencies[dependency].version}, got ${depManifest.version.toString()}`);
                process.exit(1);
            }
        }
    }
}

async function loadPlugin(manifest: PluginManifest, pluginPath: string, pluginAPI: any) {
    const plugin = await import(`${pluginPath}/${manifest.pluginPath || manifest.name}/index.ts`);
    return new plugin.default(pluginAPI);
}

export default async function Loader(pluginList: string[], pluginPath: string, pluginAPI: any, Log = console.log) {
    const enabledPlugins = new Map<string, PluginManifest>();
    Log(`Checking enabled plugins...`);
    for (const pluginName of pluginList) {
        try {
            const manifest = await getPluginManifest(pluginName, pluginPath);
            if (manifest.name !== pluginName) {
                manifest.pluginPath = pluginName;
            }
            enabledPlugins.set(pluginName, manifest);
        } catch (e) {
            console.error(`Invalid manifest: ${pluginName}`);
            process.exit(1);
        }
    }
    Log(`Checking dependencies...`);
    for (const manifest of enabledPlugins.values()) {
        if (manifest.dependencies) {
            await checkDependencies(manifest, pluginPath, enabledPlugins);
        }
    }
    Log(`Loading plugins...`);
    const plugins = new Map<string, any>();
    for (const plugin of enabledPlugins.values()) {
        Log(`${chalk.cyan(plugin.name)} [${plugin.version.toString()}]`);
        const pluginObject = {
            plugin: await loadPlugin(plugin, pluginPath, pluginAPI),
            manifest: plugin
        };
        plugins.set(plugin.name, pluginObject);
    }
    Log(`${chalk.green("Done!")}`);
    return plugins;
}
