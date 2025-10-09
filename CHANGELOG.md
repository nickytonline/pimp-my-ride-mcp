# Changelog

## [2.0.0](https://github.com/nickytonline/pimp-my-ride-mcp/compare/pimp-my-ride-mcp-v1.0.0...pimp-my-ride-mcp-v2.0.0) (2025-10-09)


### ⚠ BREAKING CHANGES

* All tool names have been changed from camelCase to snake_case. Clients must update their tool calls:
    - getCurrentBuild -> get_current_build
    - updateCarConfig -> update_car_config
    - updateDriverProfile -> update_driver_profile
    - saveBuild -> save_build
    - loadBuild -> load_build
    - listBuilds -> list_builds
    - deleteBuild -> delete_build
    - getBuildDetails -> get_build_details
    - getCustomizationOptions -> get_customization_options
    - getPersonaInfo -> get_persona_info

### Features

* Implement car customization tools and KV storage ([06dbfb1](https://github.com/nickytonline/pimp-my-ride-mcp/commit/06dbfb19d51c3d59bc71810d9aa6595492849f07))
* update tools to snake_case convention and add proper annotations ([#9](https://github.com/nickytonline/pimp-my-ride-mcp/issues/9)) ([b4969ab](https://github.com/nickytonline/pimp-my-ride-mcp/commit/b4969ab1a6a14c75ee8faed62e3da12f986702e2))


### Documentation

* added a photo ([4d66ae0](https://github.com/nickytonline/pimp-my-ride-mcp/commit/4d66ae02203f90ced554a54ba2332532791931ad))
* update README to include Docker Hub information and usage instructions ([156565c](https://github.com/nickytonline/pimp-my-ride-mcp/commit/156565cf7e5c47c87a84eefbfeaeaaac1fc470db))
* update README to link to MCP Documentation instead of OpenAI Apps SDK ([ffd33c0](https://github.com/nickytonline/pimp-my-ride-mcp/commit/ffd33c01e16ef7d408dc66b93d41ad16efb36324))
