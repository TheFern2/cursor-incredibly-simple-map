// Your access token from Cesium ion (get a free one at https://cesium.com/ion/signup)
Cesium.Ion.defaultAccessToken = '';

document.addEventListener('DOMContentLoaded', async () => {
    // Create the Cesium viewer with imagery provider
    const viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: await Cesium.createWorldTerrainAsync(),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: true,
        animation: false,
        timeline: false,
        fullscreenButton: true,
        imageryProvider: new Cesium.TileMapServiceImageryProvider({
            url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        })
    });

    // Enable depth testing so things behind the terrain disappear
    viewer.scene.globe.enableLighting = true;

    // Set initial view to United States
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-98.5795, 39.8283, 2000000.0), // Reduced height for closer view
        orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0.0
        },
        duration: 2 // 2 seconds flight duration
    });

    try {
        // Load US states GeoJSON data
        const response = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json');
        if (!response.ok) {
            throw new Error('Failed to load states data');
        }
        const statesData = await response.json();

        // Create a new data source for the states
        const statesDataSource = new Cesium.GeoJsonDataSource('states');
        
        // Load the GeoJSON data into the data source
        await statesDataSource.load(statesData, {
            stroke: Cesium.Color.WHITE,
            fill: Cesium.Color.BLUE.withAlpha(0.3),
            strokeWidth: 2,
            clampToGround: true
        });

        // Add the data source to the viewer
        await viewer.dataSources.add(statesDataSource);

        // Get all state entities
        const states = statesDataSource.entities.values;

        // Add mouse interaction for each state
        for (const state of states) {
            // Ensure the polygon has material
            if (!state.polygon) continue;

            // Set default appearance
            state.polygon.material = new Cesium.ColorMaterialProperty(Cesium.Color.BLUE.withAlpha(0.3));
            state.polygon.outline = true;
            state.polygon.outlineColor = Cesium.Color.WHITE;
            state.polygon.outlineWidth = 2;

            // Make it clickable
            state.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
        }

        // Keep track of the current label entity
        let currentLabel = null;

        // Add click handler for the entire scene
        viewer.screenSpaceEventHandler.setInputAction((movement) => {
            const pickedFeature = viewer.scene.pick(movement.position);
            
            if (Cesium.defined(pickedFeature) && pickedFeature.id && pickedFeature.id.properties) {
                const stateName = pickedFeature.id.properties.name;
                
                // Remove any existing selected state highlighting
                states.forEach(state => {
                    if (state.polygon) {
                        state.polygon.material = new Cesium.ColorMaterialProperty(Cesium.Color.BLUE.withAlpha(0.3));
                    }
                });

                // Highlight the clicked state
                pickedFeature.id.polygon.material = new Cesium.ColorMaterialProperty(Cesium.Color.YELLOW.withAlpha(0.5));

                // Remove previous label if it exists
                if (currentLabel) {
                    viewer.entities.remove(currentLabel);
                }

                // Create a popup at the click position
                const cartesian = viewer.scene.pickPosition(movement.position);
                if (Cesium.defined(cartesian)) {
                    currentLabel = viewer.entities.add({
                        position: cartesian,
                        label: {
                            text: stateName,
                            showBackground: true,
                            backgroundColor: new Cesium.Color(0.165, 0.165, 0.165, 0.8), // Dark gray background
                            backgroundPadding: new Cesium.Cartesian2(10, 7),
                            font: 'bold 16px Arial',
                            fillColor: Cesium.Color.WHITE,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            outlineWidth: 2,
                            outlineColor: Cesium.Color.BLACK,
                            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, -10),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            scale: 1.0,
                            translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.0)
                        }
                    });
                }
            } else {
                // If clicked outside a state, remove the label
                if (currentLabel) {
                    viewer.entities.remove(currentLabel);
                    currentLabel = null;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Add hover handler
        viewer.screenSpaceEventHandler.setInputAction((movement) => {
            const pickedFeature = viewer.scene.pick(movement.endPosition);
            
            if (Cesium.defined(pickedFeature) && pickedFeature.id && pickedFeature.id.polygon) {
                document.body.style.cursor = 'pointer';
                pickedFeature.id.polygon.material = new Cesium.ColorMaterialProperty(Cesium.Color.BLUE.withAlpha(0.5));
            } else {
                document.body.style.cursor = 'default';
                // Reset non-selected states
                states.forEach(state => {
                    if (state.polygon && state.polygon.material.color.getValue().alpha !== 0.5) {
                        state.polygon.material = new Cesium.ColorMaterialProperty(Cesium.Color.BLUE.withAlpha(0.3));
                    }
                });
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    } catch (error) {
        console.error('Error setting up the map:', error);
        alert('Failed to load the map data. Please try refreshing the page.');
    }

    // Enable depth testing
    viewer.scene.globe.depthTestAgainstTerrain = true;
}); 