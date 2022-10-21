class CityList {
    constructor(pageSize = 10, view = null, layer = null, container = null, outFields, reactiveUtils) {
        this.dataMaxSize = 30
        this.pos = 0
        this.graphics = []
        this.viewData = []
        this.curPager = 0
        this.scrollPager = 0
        this.totalCount = 0
        this.pageSize = pageSize

        this.view = view
        this.container = container
        this.layer = layer
        this.outFields = outFields
        this.highlight = null
        this.layerView = null
        this.canRequest = true
        this.reactiveUtils = reactiveUtils
    }

    async render() {

        // set container Height--30*itemHeight
        let containerHeight = this.getItemAndContainerHeight().container
        this.container.style.height = containerHeight + "px"



        // get the instance of the layerview representing the counties feature layer
        this.layerView = await this.view.whenLayerView(this.layer);
        if (this.canRequest) {
            this.queryFeaturesAndRenderList()
        }
        const outerContainer = this.container.parentNode

        // let itemHeight = this.getItemAndContainerHeight().item
        // outerContainer.scrollTop = itemHeight
        this.container.parentNode.addEventListener("scroll", this.scrollCallback.bind(this))

        this.reactiveUtils.when(
            () => this.view.stationary === true,
            () => {

                // Get the new extent of the view only when view is stationary.
                if (this.view.extent) {
                    this.graphics = []
                    this.viewData = []
                    this.curPager = 0
                    this.scrollPager = 0
                    this.totalCount = 0
                    this.container.parentNode.scrollTop = 0
                    this.queryFeaturesAndRenderList()
                }
            }
        );

    }

    // This function is used to fetch features from a specified start location then render the list
    // It is called when the application loads first then it is called when user scroll list
    async queryFeaturesAndRenderList() {

        this.canRequest = false
        //add Loading 
        const li = document.createElement("li");
        li.innerHTML = "Loading&hellip;"
        this.container.appendChild(li)
        // get number of all features from the service
        this.totalCount = await this.layer.queryFeatureCount({ geometry: this.view.extent });
        // if the count of graphics less than the totalCount, query features.
        // order the results by objectid
        if (this.curPager == 0 || this.graphics.length < this.totalCount) {
            const query = {
                start: this.curPager * this.pageSize,
                num: this.pageSize,
                geometry: this.view.extent,
                outFields: ["*"],
                returnGeometry: true,
                orderByFields: ["objectid"]
            };

            let featureSet = await this.layer.queryFeatures(query)
            let featureArr = featureSet.features

            featureArr.forEach(element => {
                //add a field to restore the item belongs to which page

                element["list_pager"] = this.curPager
            });
            this.graphics = this.graphics.concat(featureArr)
            this.renderList()
            this.curPager++
        } else {
            this.renderList()
        }
        this.canRequest = true
    }



    //calculate the height

    getItemAndContainerHeight() {
        let outerHeight = this.container.parentNode.clientHeight
        let perHeight = Math.floor(outerHeight / 10)
        let containerHeight = this.dataMaxSize * perHeight
        let itemHeight = perHeight - 22

        return { item: itemHeight, container: containerHeight }
    }


    // this function runs when user hover on the list

    onListHoverHandler(event) {

        const target = event.target;
        const resultId = target.getAttribute("value");

        // get the graphic corresponding to the clicked zip code
        const result =
            resultId && this.viewData && this.viewData[parseInt(resultId, 10)];

        if (result) {
            if (this.highlight) {
                this.highlight.remove();
            }
            this.highlight = this.layerView.highlight(result);

        }
    }
    scrollCallback(e) {

        const outerContainer = this.container.parentNode
        if (outerContainer) {
            let itemHeight = this.getItemAndContainerHeight().item
            let scrollTop = outerContainer.scrollTop || document.documentElement.scrollTop
            let clientHeight = outerContainer.clientHeight
            let scrollHeight = outerContainer.scrollHeight
            let dataLength = this.viewData.length
            let reqHeight = (dataLength - 1) * itemHeight
            let maxScrollHeight = this.dataMaxSize * itemHeight
            let dir = scrollTop - itemHeight

            //scroll up
            if (dir <= 0) {
                this.scrollPager = dataLength > 0 ? this.viewData[0]["list_pager"] - 1 : 0
                this.scrollPager = this.scrollPager >= 0 ? this.scrollPager : 0
                if (this.canRequest) {
                    this.queryFeaturesAndRenderList()
                }
                // to makesure the outerContainer can scroll
                if (this.viewData[0] && this.viewData[0]["list_pager"] != 0 && scrollTop == 0) {
                    outerContainer.scrollTop = itemHeight
                }
            } else {
                // if (scrollTop >= reqHeight || scrollTop >= maxScrollHeight) {
                this.scrollPager = dataLength > 0 ? this.viewData[dataLength - 1]["list_pager"] - 1 : 0
                this.scrollPager = this.scrollPager >= 0 ? this.scrollPager : 0
                if (this.canRequest) {

                    this.queryFeaturesAndRenderList()
                }
                let maxPage = Math.ceil(this.totalCount / this.pageSize)
                // to makesure the outerContainer can scroll

                if (this.viewData[dataLength - 1]["list_pager"] < maxPage && (scrollTop + clientHeight >= scrollHeight)) {
                    outerContainer.scrollTop = itemHeight
                }

                // }
            }



        }
    }
    renderList() {
        const innerContainer = this.container
        const itemHeight = this.getItemAndContainerHeight().item
        //get the data which will be rendered to the list
        if (this.graphics.length <= this.dataMaxSize) {
            this.viewData = this.graphics.slice(0)
        } else {
            this.viewData = this.graphics.slice(this.scrollPager * this.pageSize, this.scrollPager * this.pageSize + this.dataMaxSize)

        }

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < this.viewData.length; i++) {
            let result = this.viewData[i]
            const attributes = result.attributes;
            const num =result["list_pager"] * 10 + i % 10
            const name = num + " " + attributes.areaname;

            // Create a list zip codes in NY
            const li = document.createElement("li");
            li.classList.add("list-result");
            li.tabIndex = 0;
            li.setAttribute("value", i);
            li.textContent = name;

            li.style.height = itemHeight + "px"
            li.style.lineHeight = itemHeight + "px"
            li.addEventListener("mouseenter", this.onListHoverHandler.bind(this));
            fragment.appendChild(li);
            //add end text
            if(num==this.totalCount-1){
                const li = document.createElement("li");
                li.innerHTML = "no more data..."
                fragment.appendChild(li)
            }
        }
        // Empty the current list
        innerContainer.innerHTML = "";
        innerContainer.appendChild(fragment);

    }


}
