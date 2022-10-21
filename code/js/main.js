

require(["esri/Map", "esri/views/MapView", "esri/layers/MapImageLayer", "esri/layers/FeatureLayer",
    "esri/widgets/FeatureTable", "esri/core/reactiveUtils"], (
        Map,
        MapView,
        MapImageLayer,
        FeatureLayer, FeatureTable, reactiveUtils
    ) => {
    // helper function to create a symbol
    function createSymbol (color, size) {
        return {
            type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
            color: color,
            size: size,
            outline: {
                width: 0.5,
                color: [0, 0, 0, 0.2]
            }
        };
    }

    /*****************************************************************
    * Create a renderer for the city data based on the population
    * value of each feature.
    *****************************************************************/

    const cityRenderer = {
        type: "class-breaks", // autocasts as new ClassBreaksRenderer()
        field: "pop2000",
        classBreakInfos: [
            {
                minValue: 0,
                maxValue: 25000,
                symbol: createSymbol("#a4c58c", 10)
            },
            {
                minValue: 25000,
                maxValue: 150000,
                symbol: createSymbol("#e9a9c9", 20)
            },
            {
                minValue: 150000,
                maxValue: 750000,
                symbol: createSymbol("#6c76e9", 26)
            },
            {
                minValue: 750000,
                maxValue: 100000000,
                symbol: createSymbol("#7300c1", 30)
            }
        ]
    };

    /*****************************************************************
     * Create a MapImageLayer instance pointing to a Map Service
     * containing data about US Counties, States and Highways.
     * Define sublayers with visibility for each layer in Map Service.
     *****************************************************************/
    const img_layer = new MapImageLayer({
        url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer",
        sublayers: [
            {
                id: 3,
                visible: true
            },
            {
                id: 2,
                visible: true,

            },
            {
                id: 1,
                visible: true
            }
        ]
    });

    const city_feature_layer = new FeatureLayer({
        url: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",
        id: 0,
        outFields: ["*"],
        renderer: cityRenderer,
        //    featureReduction : {
        //     type: "cluster",
        //     clusterRadius: "120px"
        //   }
    }
    );

    /*****************************************************************
     * Add the layers to a map
     *****************************************************************/
    const map = new Map({
        basemap: "gray-vector",
        layers: [img_layer, city_feature_layer]
    });

    const view = new MapView({
        container: "viewDiv",
        map: map,
        zoom: 3,
        center: [-99, 39]
    });
    let listContainer = document.getElementById("city_graphics");
    let citylist = new CityList(10, view, city_feature_layer, listContainer, ["objectid", "areaname", "pop2000"],reactiveUtils)
    citylist.render()
});