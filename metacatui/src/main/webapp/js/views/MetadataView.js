/*global define */
define(['jquery',
        'jqueryui',
		'underscore', 
		'backbone',
		'gmaps',
		'fancybox',
		'models/PackageModel',
		'models/SolrResult',
		'views/ProvChartView',
		'views/MetadataIndexView',
		'views/ExpandCollapseListView',
		'views/ProvStatementView',
		'views/PackageTableView',
		'views/AnnotatorView',
		'views/CitationView',
		'text!templates/dataSource.html',
		'text!templates/publishDOI.html',
		'text!templates/newerVersion.html',
		'text!templates/loading.html',
		'text!templates/usageStats.html',
		'text!templates/downloadButton.html',
		'text!templates/downloadContents.html',
		'text!templates/alert.html',
		'text!templates/editMetadata.html',
		'text!templates/dataDisplay.html',
		'text!templates/map.html'
		], 				
	function($, $ui, _, Backbone, gmaps, fancybox, Package, SolrResult, ProvChart, MetadataIndex, ExpandCollapseList, ProvStatement, PackageTable, AnnotatorView, CitationView, DataSourceTemplate, PublishDoiTemplate, VersionTemplate, LoadingTemplate, UsageTemplate, DownloadButtonTemplate, DownloadContentsTemplate, AlertTemplate, EditMetadataTemplate, DataDisplayTemplate, MapTemplate, AnnotationTemplate) {
	'use strict';

	
	var MetadataView = Backbone.View.extend({
		
		subviews: [],
		
		model: null,

		el: '#Content',
		
		type: "Metadata",
		
		//Templates
		template: null,
		alertTemplate: _.template(AlertTemplate),
		doiTemplate: _.template(PublishDoiTemplate),
		usageTemplate: _.template(UsageTemplate),
		versionTemplate: _.template(VersionTemplate),
		loadingTemplate: _.template(LoadingTemplate),
		dataSourceTemplate: _.template(DataSourceTemplate),
		downloadButtonTemplate: _.template(DownloadButtonTemplate),
		downloadContentsTemplate: _.template(DownloadContentsTemplate),
		editMetadataTemplate: _.template(EditMetadataTemplate),
		dataDisplayTemplate: _.template(DataDisplayTemplate),
		mapTemplate: _.template(MapTemplate),
				
		objectIds: [],
				
		// Delegated events for creating new items, and clearing completed ones.
		events: {
			"click #publish" : "publish",
			"mouseover .highlight-node"  : "highlightNode",
			"mouseout  .highlight-node"  : "highlightNode"
		},
		
		initialize: function (options) {
			if((options === undefined) || (!options)) var options = {};

			this.pid = options.pid || options.id || appModel.get("pid") || null;
			this.citationEl = this.el;
		},
				
		// Render the main metadata view
		render: function () {

			appModel.set('headerType', 'default');
			
			//Reset a new class map - for matching ids->class names in prov charts
			this.classMap = new Array();
			this.subviews = new Array();
			
			// get the pid to render
			if(!this.pid){
				var pid = appModel.get("pid");
				this.pid = pid;
			}
			else var pid = this.pid;
			
			// URL encode the pid
			this.encodedPid = encodeURIComponent(pid);
			
			// Check for a view service in this appModel
			if((appModel.get('viewServiceUrl') !== undefined) && (appModel.get('viewServiceUrl'))) 
				var endpoint = appModel.get('viewServiceUrl') + pid;
					
			if(endpoint && (typeof endpoint !== "undefined")){
				var viewRef = this;
				this.$el.load(endpoint,
						function(response, status, xhr) {
							//Our fallback is to show the metadata details from the Solr index
							if (status=="error") 
								viewRef.renderMetadataFromIndex();
							else{
								//Mark this as a metadata doc with no stylesheet, or one that is at least different than usual EML and FGDC
								if(response.indexOf('id="Metadata"') == -1)
									viewRef.$el.addClass("container no-stylesheet");
								
								viewRef.$el.fadeIn("slow");
								
								//Get the citation element
								viewRef.getCitation();
								
								//Get the package details from the index, too
								viewRef.getPackageDetails();
								
								// is this the latest version? (includes DOI link when needed)
								viewRef.showLatestVersion();
								
								//Add a map of the spatial coverage
								if(gmaps) viewRef.insertSpatialCoverageMap();
								
								//Insert the breadcrumbs
								viewRef.insertBreadcrumbs();
								
								viewRef.setUpAnnotator();
							}
						});
			}
			else this.renderMetadataFromIndex();		
						
			return this;
		},

		/* If there is no view service available, then display the metadata fields from the index */
		renderMetadataFromIndex: function(){
			var metadataFromIndex = new MetadataIndex({ 
				pid: this.pid, 
				parentView: this 
				});
			this.subviews.push(metadataFromIndex);
			
			//Add the package details once the metadata from the index is drawn 
			this.listenToOnce(metadataFromIndex, 'complete', this.getCitation);
			this.listenToOnce(metadataFromIndex, 'complete', this.insertBreadcrumbs);
			this.listenToOnce(metadataFromIndex, 'complete', this.getPackageDetails);
			this.listenToOnce(metadataFromIndex, 'complete', this.showLatestVersion);
			
			//Add the metadata HTML
			this.$el.html(metadataFromIndex.render().el);
			
			//Add a map of the spatial coverage
			if(gmaps) this.insertSpatialCoverageMap();
			
			// render annotator from index content, too
			this.setUpAnnotator();			
		},
		
		getCitation: function(){
			var citation = "",
				citationEl = null;
			
			//Find the citation element
			if(this.$(".citation").length > 0){
				//Get the text for the citation
				citation = this.$(".citation").text();
				
				//Save this element in the view
				citationEl = this.$(".citation");
			}
			//Older versions of Metacat (v2.4.3 and older) will not have the citation class in the XSLT. Find the citation another way 
			else{
				//Find the DOM element with the citation
				var wells = this.$('.well'),
					viewRef = this;		
				
				//Find the div.well with the citation. If we never find it, we don't insert the list of contents
				_.each(wells, function(well){
					if(!citationEl && ($(well).find('#viewMetadataCitationLink').length > 0) || ($(well).children(".row-fluid > .span10 > a"))){
						
						//Save this element in the view
						citationEl = well;
						
						//Mark this in the DOM for CSS styling
						$(well).addClass('citation');	
						
						//Save the text of the citation
						citation = $(well).text();
					}
				});
				
		    	//Remove the unnecessary classes that are used in older versions of Metacat (2.4.3 and older)
		    	var citationText = $(citationEl).find(".span10");
				$(citationText).removeClass("span10").addClass("span12");
			}
			
			//Set the document title to the citation
			appModel.set("title", citation);
			
			//Save the citation element in the view
			if(!citationEl){
				this.citationEl = $(document.createElement("div")).addClass("citation");
				this.$el.prepend(this.citationEl);
			}
			else
				this.citationEl = citationEl;
		},
		
		insertBreadcrumbs: function(){
			
			var breadcrumbs = $(document.createElement("ol"))
						      .addClass("breadcrumb")
						      .append($(document.createElement("li"))
						    		  .addClass("home")
						    		  .append($(document.createElement("a"))
						    				  .attr("href", "#")
						    				  .addClass("home")
						    				  .text("Home")))
		    				  .append($(document.createElement("li"))
		    						  .addClass("search")
						    		  .append($(document.createElement("a"))
						    				  .attr("href", "#data/page/" + appModel.get("page"))
						    				  .addClass("search")
						    				  .text("Search")))
		    				  .append($(document.createElement("li"))
						    		  .append($(document.createElement("a"))
						    				  .attr("href", "#" + Backbone.history.fragment)
						    				  .addClass("inactive")
						    				  .text("Metadata")));
			
			if(uiRouter.lastRoute() == "data"){
				$(breadcrumbs).prepend($(document.createElement("a"))
						         .attr("href", "#data/page/" + appModel.get("page"))
						         .attr("title", "Back")
						         .addClass("back")
						         .text(" Back to search")
						         .prepend($(document.createElement("i"))
						        		  .addClass("icon-angle-left")));
				$(breadcrumbs).find("a.search").addClass("inactive");
			}
			
			this.$el.prepend(breadcrumbs);
		},
		
		/*
		 * Creates a package model and retrieves the info about all members of that package 
		 */
		getPackageDetails: function(pid) {
			var viewRef = this;
			
			//If no id is passed, used the one in the appModel
			if((typeof pid === "undefined") || !pid) var pid = this.pid;
			
			//Create a model representing the data package
			this.packageModel = new Package();
			this.listenToOnce(this.packageModel, 'complete', function(){
				var metadataModel = _.findWhere(viewRef.packageModel.get("members"), { id: pid });
				viewRef.model = metadataModel;
			});
			this.listenToOnce(this.packageModel, 'complete', this.getEntityNames);
			this.listenToOnce(this.packageModel, 'complete', this.alterMarkup);			
			this.listenToOnce(this.packageModel, 'complete', this.insertPackageDetails);
			this.listenToOnce(this.packageModel, 'complete', this.insertCitation);
			this.listenToOnce(this.packageModel, 'complete', this.insertDataSource);
			this.listenToOnce(this.packageModel, 'complete', this.insertControls);
			this.listenToOnce(nodeModel, 'change:members',  this.insertDataSource);
			this.packageModel.getMembersByMemberID(pid);
		},
		
		alterMarkup: function(){
			//Find the taxonomic range and give it a class for styling - for older versions of Metacat only (v2.4.3 and older)
			if(!this.$(".taxonomicCoverage").length)
				this.$('h4:contains("Taxonomic Range")').parent().addClass('taxonomicCoverage');
			
			//Remove the title section (redundant)
			var title = this.$(".control-group.title");
			if(!title.length){
				//Try to find the title label
				var titleLabel = this.$("label:contains('Titlell')");
				if(titleLabel.length && (titleLabel.text() == "Title")) 
					title = titleLabel.parents(".control-group");
				
				//Try to find the element with the title text
				if(!title.length){
					title = this.$(".controls:contains('" + this.model.get("title") + "')");
					if(title.length) title = title.parents(".control-group");
				}
			}
			if(title.length) title.detach();
			
		},
		
		/*
		 * Inserts a table with all the data package member information and sends the call to display annotations
		 */
		insertPackageDetails: function(){	
			var viewRef = this;
			
			//If the package model is not complete, don't do anything
			if(!this.packageModel.complete) return this;
				
			//** Draw the package table **//	
			var tableView = new PackageTable({ model: this.packageModel, currentlyViewing: this.pid, parentView: this});
			
			//Get the package table container
			var tableContainer = this.$("#downloadContents");
			
			//Older versions of Metacat will not have this container
			if(!$(tableContainer).length){
				tableContainer = $(document.createElement("div")).attr("id", "downloadContents");
				$(this.citationEl).after(tableContainer);
			}
			
			//Insert the package table HTML 
			$(tableContainer).html(tableView.render().el);
			
			//Hide the Metadata buttons that have no matching entity details section
			var count = 0;
			_.each($("#downloadContents .preview"), function(btn){
				if(!viewRef.findEntityDetailsContainer($(btn).attr("data-id"))){
					$(btn).addClass("hidden");
					count++;
				}
			});
			if(count == $("#downloadContents .preview").length){
				$("td.more-info").addClass("hidden");
				$("th.more-info").addClass("hidden");
			}
							
			//Remove the extra download button returned from the XSLT since the package table will have all the download links
			$("#downloadPackage").detach();
			
		    //Display the images in this package
		    this.insertDataDetails();
		    
		    //Show the provenance trace for this package			
			this.listenToOnce(this.packageModel, "change:provenanceFlag", this.drawProvCharts);
			this.packageModel.getProvTrace();
		    
		    return this;
		},
				
		insertSpatialCoverageMap: function(customCoordinates){
			
			//Find the geographic region container. Older versions of Metacat (v2.4.3 and less) will not have it classified so look for the header text
			if(!this.$(".geographicCoverage").length){
				//For EML
				var title = this.$('h4:contains("Geographic Region")');
				
				//For FGDC
				if(title.length == 0){
					title = this.$('label:contains("Bounding Coordinates")');
				}
				
				var georegionEls = $(title).parent();
				var parseText = true;
				var directions = new Array('North', 'South', 'East', 'West');
			}
			else{
				var georegionEls = this.$(".geographicCoverage");
				var directions = new Array('north', 'south', 'east', 'west');
			}
			
			for(var i=0; i<georegionEls.length; i++){
				var georegion = georegionEls[i];
				
				if(typeof customCoordinates !== "undefined"){
					//Extract the coordinates
					var n = customCoordinates[0];
					var s = customCoordinates[1];
					var e = customCoordinates[2];
					var w = customCoordinates[3];
				}
				else{
					var coordinates = new Array();
					
					_.each(directions, function(direction){
						//Parse text for older versions of Metacat (v2.4.3 and earlier)
						if(parseText){
							var labelEl = $(georegion).find('label:contains("' + direction + '")');
							if(labelEl){
								var coordinate = $(labelEl).next().html();
								coordinate = coordinate.substring(0, coordinate.indexOf("&nbsp;"));
							}
						}
						else{
							var coordinate = $(georegion).find("." + direction + "BoundingCoordinate").attr("data-value");
						}
						
						//Save our coordinate value
						coordinates.push(coordinate);	
					});
					
					//Extract the coordinates
					var n = coordinates[0];
					var s = coordinates[1];
					var e = coordinates[2];
					var w = coordinates[3];
				}
				
				//Create Google Map LatLng objects out of our coordinates
				var latLngSW = new gmaps.LatLng(s, w);
				var latLngNE = new gmaps.LatLng(n, e);
				var latLngNW = new gmaps.LatLng(n, w);
				var latLngSE = new gmaps.LatLng(s, e);
				
				//Get the centertroid location of this data item
				var bounds = new gmaps.LatLngBounds(latLngSW, latLngNE);
				var latLngCEN = bounds.getCenter();

				var url = "https://maps.google.com/?ll=" + latLngCEN.lat() + "," + latLngCEN.lng() + 
						  "&spn=0.003833,0.010568" +
						  "&t=h" +
						  "&z=16";
				//Create a google map image
				var mapHTML = "<img class='georegion-map' " +
							  "src='https://maps.googleapis.com/maps/api/staticmap?" +
							  "center="+latLngCEN.lat()+","+latLngCEN.lng() +
							  "&size=800x350" +
							  "&maptype=terrain" +
							  "&markers=size:mid|color:0xDA4D3Aff|"+latLngCEN.lat()+","+latLngCEN.lng() +
							  "&path=color:0xDA4D3Aff|weight:3|"+latLngSW.lat()+","+latLngSW.lng()+"|"+latLngNW.lat()+","+latLngNW.lng()+"|"+latLngNE.lat()+","+latLngNE.lng()+"|"+latLngSE.lat()+","+latLngSE.lng()+"|"+latLngSW.lat()+","+latLngSW.lng()+
							  "&visible=" + latLngSW.lat()+","+latLngSW.lng()+"|"+latLngNW.lat()+","+latLngNW.lng()+"|"+latLngNE.lat()+","+latLngNE.lng()+"|"+latLngSE.lat()+","+latLngSE.lng()+"|"+latLngSW.lat()+","+latLngSW.lng()+
							  "&sensor=false" +
							  "&key=" + mapKey + "'/>";

				//Find the spot in the DOM to insert our map image
				if(parseText) var insertAfter = ($(georegion).find('label:contains("West")').parent().parent().length) ? $(georegion).find('label:contains("West")').parent().parent() :  georegion; //The last coordinate listed
				else 	      var insertAfter = georegion;
				$(insertAfter).append(this.mapTemplate({
					map: mapHTML,
					url: url
				}));
				
				$('.fancybox-media').fancybox({
					openEffect  : 'elastic',
					closeEffect : 'elastic',
					helpers: {
						media: {}
					}
				})
				
			}
			
			return true;

		},
		
		insertCitation: function(){
			if(!this.citationEl || !this.packageModel) return false;
			if(this.packageModel.get("members").length == 0) return false;
						
			//Get the model for this metadata doc
			var metadataModel = _.findWhere(this.packageModel.get("members"), {id: this.pid});
			if(!metadataModel) return false;
			
			//Create a citation element from the model attributes
			var newCitationEl = new CitationView({
									model: metadataModel, 
									createLink: false }).render().el;
			var citationContainer = $(document.createElement("div")).addClass("citation-container").append(newCitationEl);
			
			//Insert the citation into the page
			$(this.citationEl).replaceWith(citationContainer);
			
			this.citationEl = newCitationEl;			
		},
		
		insertDataSource: function(){
			if(!this.citationEl) this.getCitation();			
			if(!this.packageModel || !nodeModel || !nodeModel.get("members").length) return;
			
			//Get this metadata doc from the package model
			var thisDoc = _.findWhere(this.packageModel.get("members"), {id: this.pid});
			if(!thisDoc) return false;
			
			var dataSource = nodeModel.getMember(thisDoc);
			
			if(dataSource && dataSource.logo){
				//Insert the data source template
				$(this.citationEl).after(this.dataSourceTemplate({
					node : dataSource
				})).addClass("has-data-source");
				this.$(".popover-this").popover();
				this.$(".tooltip-this").tooltip();
			}
		},
		
		/*
		 * Checks the authority for the logged in user for this dataset 
		 * and inserts control elements onto the page for the user to interact with the dataset - edit, publish, etc.
		 */
		insertControls: function(){
			//Do not show user controls for older versions of data sets
			if(this.model.get("obsoletedBy") && (this.model.get("obsoletedBy").length > 0))
				return false;
			
			//Get the HTML elements we will use to insert the controls
			var insertNear = this.$el.children().first(); 
				
			if(this.citationEl && ($(this.citationEl).parents(".citation-container").length > 0))
				insertNear = $(this.citationEl).parents(".citation-container");				
			
			//Save some references
			var pid     = this.model.get("id") || this.pid,
				model   = this.model,
				viewRef = this;

			this.listenTo(this.model, "change:isAuthorized", function(){
				if(!model.get("isAuthorized")) return false;

				//Insert the controls container
				var controlsEl = $(document.createElement("div")).addClass("authority-controls inline-buttons");
				$(insertNear).before(controlsEl);
	
				//Insert an Edit button
				controlsEl.append(
					viewRef.editMetadataTemplate({
						identifier: pid
					}));
				
				//Insert a Publish button if its not already published with a DOI	
				if(!model.isDOI()){					
					//Insert the template
					controlsEl.append(
						viewRef.doiTemplate({
							isAuthorized: true,
							identifier: pid
						}));
				}
			});
			this.model.checkAuthority();
		},
		
		/*
		 * Renders ProvChartViews on the page to display provenance on a package level and on an individual object level.
		 * This function looks at four sources for the provenance - the package sources, the package derivations, member sources, and member derivations 
		 */
		drawProvCharts: function(){
			//Provenance has to be retrieved from the Package Model (getProvTrace()) before the charts can be drawn 
			if(this.packageModel.get("provenanceFlag") != "complete") return false;
			
			var view = this;
			
			//Draw two flow charts to represent the sources and derivations at a package level			
			var packageSources     = this.packageModel.get("sourcePackages"),
				packageDerivations = this.packageModel.get("derivationPackages");

			if(Object.keys(packageSources).length){
				var sourceProvChart = new ProvChart({
					sources      : packageSources,
					context      : this.packageModel,
					contextEl    : this.$("#Metadata"),
					packageModel : this.packageModel,
					parentView   : view
				});	
				this.subviews.push(sourceProvChart);
				this.$("#Metadata").before(sourceProvChart.render().el).addClass("hasProvLeft");	
			}
			if(Object.keys(packageDerivations).length){
				var derivationProvChart = new ProvChart({
					derivations  : packageDerivations,
					context      : this.packageModel,
					contextEl    : this.$("#Metadata"),
					packageModel : this.packageModel,
					parentView   : view
				});		
				this.subviews.push(derivationProvChart);
				this.$("#Metadata").after(derivationProvChart.render().el).addClass("hasProvRight");			
			}			
			
			//Draw the provenance charts for each member of this package at an object level
			_.each(this.packageModel.get("members"), function(member, i){
				//var entityDetailsSection = view.$('.entitydetails[data-id="' + member.get("id") + '"]');
				var entityDetailsSection = view.findEntityDetailsContainer(member.get("id"));

				//Retrieve the sources and derivations for this member
				var memberSources 	  = member.get("provSources"),
					memberDerivations = member.get("provDerivations");

				//Make the source chart for this member
				if(memberSources.length){
					var memberSourcesProvChart = new ProvChart({
						sources      : memberSources, 
						context      : member,
						contextEl    : entityDetailsSection,
						packageModel : view.packageModel,
						parentView   : view
					});	
					view.subviews.push(memberSourcesProvChart);
					$(entityDetailsSection).before(memberSourcesProvChart.render().el).addClass("hasProvLeft");
					view.$("#Metadata").addClass("gutters");
				}
				if(memberDerivations.length){
					//Make the derivation chart for this member
					var memberDerivationsProvChart = new ProvChart({
						derivations  : memberDerivations,
						context      : member,
						contextEl    : entityDetailsSection,
						packageModel : view.packageModel,
						parentView   : view
					});	
					view.subviews.push(memberDerivationsProvChart);
					$(entityDetailsSection).after(memberDerivationsProvChart.render().el).addClass("hasProvRight");				
					view.$("#Metadata").addClass("gutters");
				}
			});
			
			//Make all of the prov chart nodes look different based on id
			if(this.$(".prov-chart").length > 0){
				var allNodes = this.$(".prov-chart .node"),
				ids      = [],
				view     = this,
				i        = 1;
			
				$(allNodes).each(function(){ ids.push($(this).attr("data-id"))});
				ids = _.uniq(ids);
				
				_.each(ids, function(id){					
					var matchingNodes = view.$(".prov-chart .node[data-id='" + id + "']");
					//var matchingEntityDetails = view.findEntityDetailsContainer(id);
					
					//Don't use the unique class on images since they will look a lot different anyway by their image
					if(!$(matchingNodes).first().hasClass("image")){	
						var className = "uniqueNode" + i;
						//Add the unique class and up the iterator
						$(matchingNodes).addClass(className);
						
					/*	if(matchingEntityDetails)
							$(matchingEntityDetails).addClass(className);*/
						
						//Save this id->class mapping in this view
						view.classMap.push({ id        : id, 
											 className : className });
						i++;
					}
				});
			}
		},
		
		/*
		 * param dataObject - a SolrResult representing the data object returned from the index
		 * returns - true if this data object is an image, false if it is other
		 */
		isImage: function(dataObject){
			//The list of formatIds that are images
			var imageIds = ["image/gif",
			                "image/jp2",
			                "image/jpeg",
			                "image/png",
			                "image/svg xml",
			                "image/svg+xml",
			                "image/bmp"];
			
			//Does this data object match one of these IDs?
			if(_.indexOf(imageIds, dataObject.get('formatId')) == -1) return false;			
			else return true;
			
		},
		
		/*
		 * param dataObject - a SolrResult representing the data object returned from the index
		 * returns - true if this data object is a pdf, false if it is other
		 */
		isPDF: function(dataObject){
			//The list of formatIds that are images
			var ids = ["application/pdf"];
			
			//Does this data object match one of these IDs?
			if(_.indexOf(ids, dataObject.get('formatId')) == -1) return false;			
			else return true;			
		},
		
		getEntityNames: function(){
			var viewRef = this;
						
			_.each(this.packageModel.get("members"), function(solrResult, i){
				
				if(solrResult.get("formatType") == "METADATA") 
					entityName = solrResult.get("title");
				else{
					var container = viewRef.findEntityDetailsContainer(solrResult.get("id"));
					if(container && container.length > 0){
						var entityName = $(container).find(".entityName").attr("data-entity-name");
						if((typeof entityName === "undefined") || (!entityName)){
							entityName = $(container).find(".control-label:contains('Entity Name') + .controls-well").text();
							if((typeof entityName === "undefined") || (!entityName)) 
								entityName = null;
						}
					}
					else
						entityName = null;
	
				}
				
				//Set the entityName, even if it's null
				solrResult.set("entityName", entityName);
			});
		},
		
		findEntityDetailsContainer: function(id){
			//Are we looking for the main object that this MetadataView is displaying?
			if(id == this.pid){
				if(this.$("#Metadata").length > 0) return this.$("#Metadata");
				else return this.el;
			}
			else{
				//Metacat 2.4.2 and up will have the Online Distribution Link marked 
				var link = this.$(".entitydetails a[data-id='" + id + "']");
			}
			
			//Otherwise, try looking for an anchor with the id matching this object's id
			if(link.length < 1)
				link = this.$("a#" + id.replace(/[^A-Za-z0-9]/g, "-"));

			//Get metadata index view
			var metadataFromIndex = _.findWhere(this.subviews, {type: "MetadataIndex"});
			if(typeof metadataFromIndex === "undefined") metadataFromIndex = null;
			
			//Otherwise, find the Online Distribution Link the hard way 
			if((link.length < 1) && (!metadataFromIndex))
				link = this.$(".control-label:contains('Online Distribution Info') + .controls-well > a[href*='" + id + "']");
						
			if(link.length > 0){
				//Get the container element
				var container  = $(link).parents(".entitydetails"); 
				
				if(container.length < 1){
					//backup - find the parent of this link that is a direct child of the form element
					var firstLevelContainer = _.intersection($(link).parents("form").children(), $(link).parents());
					//Find the controls-well inside of that first level container, which is the well that contains info about this data object
					if(firstLevelContainer.length > 0)
						container = $(firstLevelContainer).children(".controls-well");
							
					if((container.length < 1) && (firstLevelContainer.length > 0))
						container = firstLevelContainer;
					
					$(container).addClass("entitydetails");
				}
				
				return container;
			}	
			else
				return false;
		},
		
		/*
		 * Inserts new image elements into the DOM via the image template. Use for displaying images that are part of this metadata's resource map.
		 */
		insertDataDetails: function(){
			//If there is a metadataIndex subview, render from there.
			var metadataFromIndex = _.findWhere(this.subviews, {type: "MetadataIndex"});
			if(typeof metadataFromIndex !== "undefined"){
				metadataFromIndex.insertDataDetails();
				return;
			}

			var dataDisplay = "",
				viewRef = this,
				images = [],
				pdfs = [],
				other = [],
				packageMembers = this.packageModel.get("members");
						
			//==== Loop over each visual object and create a dataDisplay template for it to attach to the DOM ====
			for(var i=0; i < packageMembers.length; i++){
				var solrResult = packageMembers[i],
					objID      = solrResult.get("id");
				
				if(objID == this.pid) continue;
								
				//Is this a visual object (image or PDF)?
				var type = solrResult.getType();
				if(type == "image")
					images.push(solrResult);
				else if(type == "PDF")
					pdfs.push(solrResult);
				
				//Find the part of the HTML Metadata view that describes this data object
				var anchor         = $(document.createElement("a")).attr("id", objID),
					downloadButton = this.downloadButtonTemplate({href: solrResult.get("url")}),
					container      = this.findEntityDetailsContainer(objID),
					dataDisplay = viewRef.dataDisplayTemplate({
										 type : type,
										  src : solrResult.get("url"), 
									    objID : objID
					});

				//Insert the data display HTML and the anchor tag to mark this spot on the page 
				if(container){
					if((type == "image") || (type == "PDF")){
						if($(container).children("label").length > 0)
							$(container).children("label").first().after(dataDisplay);
						else
							$(container).prepend(dataDisplay);
					}
					$(container).prepend(anchor);
					
					var nameLabel = $(container).find("label:contains('Entity Name')");
					if(nameLabel.length > 0)
						$(nameLabel).parent().after(downloadButton);
				}				
			}
						
			//==== Initialize the fancybox images =====
			// We will be checking every half-second if all the HTML has been loaded into the DOM - once they are all loaded, we can initialize the lightbox functionality.
			var numImages  = images.length,
				numPDFS	   = pdfs.length,
				//The shared lightbox options for both images and PDFs
				lightboxOptions = {
						prevEffect	: 'elastic',
						nextEffect	: 'elastic',
						closeEffect : 'elastic',
						openEffect  : 'elastic',
						aspectRatio : true,
						closeClick : true,
						afterLoad  : function(){
							//Create a custom HTML caption based on data stored in the DOM element
							this.title = this.title + " <a href='" + this.href + "' class='btn' target='_blank'>Download</a> ";
						},
						helpers	    : {
						    title : {
							      type : 'outside'
						    }
						}
				};
			
			if(numPDFS > 0){
				var numPDFChecks  = 0,
					lightboxPDFSelector = "a[class^='fancybox'][data-fancybox-iframe]",
					pdfIntervalID = window.setInterval(initializePDFLightboxes, 500);
				
				//Add additional options for PDFs
				var pdfLightboxOptions = lightboxOptions;
				pdfLightboxOptions.type = "iframe";
				pdfLightboxOptions.iframe = { preload: false };
				pdfLightboxOptions.height = "98%";
				
				var initializePDFLightboxes = function(){
					numPDFChecks++;
					
					//Initialize what images have loaded so far after 5 seconds
					if(numPDFChecks == 10){ 
						$(lightboxPDFSelector).fancybox(pdfLightboxOptions);
					}
					//When 15 seconds have passed, stop checking so we don't blow up the browser
					else if(numPDFChecks > 30){
						window.clearInterval(pdfIntervalID);
						return;
					}
					
					//Are all of our pdfs loaded yet?
					if(viewRef.$(lightboxPDFSelector).length < numPDFs) return;
					else{					
						//Initialize our lightboxes
						$(lightboxPDFSelector).fancybox(pdfLightboxOptions);
						
						//We're done - clear the interval
						window.clearInterval(pdfIntervalID);
					}				
				}
				
			}
			
			if(numImages > 0){
				var numImgChecks  = 0, //Keep track of how many interval checks we have so we don't wait forever for images to load
					lightboxImgSelector = "a[class^='fancybox'][data-fancybox-type='image']";
					
				//Add additional options for images
				var imgLightboxOptions = lightboxOptions;
				imgLightboxOptions.type = "image";
				imgLightboxOptions.perload = 1;
				
				var initializeImgLightboxes = function(){
					numImgChecks++;
					
					//Initialize what images have loaded so far after 5 seconds
					if(numImgChecks == 10){ 
						$(lightboxImgSelector).fancybox(imgLightboxOptions);
					}
					//When 15 seconds have passed, stop checking so we don't blow up the browser
					else if(numImgChecks > 30){
						$(lightboxImgSelector).fancybox(imgLightboxOptions);
						window.clearInterval(imgIntervalID);
						return;
					}
					
					//Are all of our images loaded yet?
					if(viewRef.$(lightboxImgSelector).length < numImages) return;
					else{					
						//Initialize our lightboxes
						$(lightboxImgSelector).fancybox(imgLightboxOptions);
						
						//We're done - clear the interval
						window.clearInterval(imgIntervalID);
					}				
				}
				
				var imgIntervalID = window.setInterval(initializeImgLightboxes, 500);
			}
		},
		
		/*
		 * Inserts new image elements into the DOM via the image template. Use for displaying images that are part of this metadata's resource map.
		 * param pdfs - an array of objects that represent the data objects returned from the index. Each should be a PDF
		 */
		insertPDFs: function(pdfs){
			var html = "",
			 viewRef = this;
		
			//Loop over each image object and create a dataDisplay template for it to attach to the DOM
			for(var i=0; i<pdfs.length; i++){
				//Find the part of the HTML Metadata view that describes this data object
				var container = this.$el.find("td:contains('" + pdfs[i].id + "')").parents(".controls-well");
				
				//Harvest the Object Name for an image caption 
				if(container !== undefined) var title = container.find("label:contains('Object Name')").next().text();
				else{
					var title = "";
					container = viewRef.el;
				}
				//Create an element using the dataDisplay template
				html = this.dataDisplayTemplate({
					 type : "pdf",
					  src : appModel.get('objectServiceUrl') + pdfs[i].id,
					title : title 
				});
	
				// Insert the element into the DOM
				$(container).append(html);				
			}
		
			//==== Initialize the fancybox images =====
			// We will be checking every half-second if all the images have been loaded into the DOM - once they are all loaded, we can initialize the lightbox functionality.
			var numPDFs  = pdfs.length,
				numChecks  = 0, //Keep track of how many interval checks we have so we don't wait forever for images to load 
				lightboxSelector = "a[class^='fancybox'][data-fancybox-iframe]",
				intervalID = window.setInterval(initializeLightboxes, 500);
			
			//Set up our lightbox options
			var lightboxOptions = {
					prevEffect	: 'elastic',
					nextEffect	: 'elastic',
					closeEffect : 'elastic',
					openEffect  : 'elastic',
					type 		: "iframe",
					aspectRatio : true,
					helpers	    : {
						    title : {
							      type : 'outside'
						    }
					},
				   iframe	  : {
					   		preload : false
				   },
				   closeClick : true,
				   afterLoad  : function(){
					   //Create a custom HTML caption based on data stored in the DOM element
					   this.title = this.title + " <a href='" + this.href + "' class='btn' target='_blank'>Download</a> ";
				   }
			}
		
			function initializeLightboxes(){
				numChecks++;
				
				//Initialize what images have loaded so far after 5 seconds
				if(numChecks == 10){ 
					$(lightboxSelector).fancybox(lightboxOptions);
				}
				//When 15 seconds have passed, stop checking so we don't blow up the browser
				else if(numChecks > 30){
					window.clearInterval(intervalID);
					return;
				}
				
				//Are all of our pdfs loaded yet?
				if(viewRef.$(lightboxSelector).length < numPDFs) return;
				else{					
					//Initialize our lightboxes
					$(lightboxSelector).fancybox(lightboxOptions);
					
					//We're done - clear the interval
					window.clearInterval(intervalID);
				}				
			}
		},
		
		replaceEcoGridLinks: function(pids){
			var viewRef = this;
			
			//Find the element in the DOM housing the ecogrid link
			$("label:contains('Online Distribution Info')").next().each(function(){
				var link = $(this).find("a:contains('ecogrid://')");
				_.each(link, function(thisLink){
					
					//Get the link text
					var linkText = $(thisLink).text();
					
					//Clean up the link text
					var start = linkText.lastIndexOf("/");
					var ecogridPid = linkText.substr(start+1);
					
					//Iterate over each id in the package and try to fuzzily match the ecogrid link to the id
					for(var i = 0; i < pids.length; i++){
						
						//If we find a match, replace the ecogrid links with a DataONE API link to the object
						if(pids[i].indexOf(ecogridPid) > -1){
							
							$(thisLink).attr('href', appModel.get('objectServiceUrl') + encodeURIComponent(pids[i]));
							$(thisLink).text(pids[i]);
							
							//Insert an anchor at the parent element that contains the data object detials
							var parents = $(thisLink).parents();
							_.each(parents, function(parent){
								if($(parent).hasClass("dataTableContainer"))
									$(parent).prepend('<a name="' + pids[i] + '"></a>');
							});
														
							//We can stop looking at the pids now
							i = pids.length;
						}
					}
				});			
				
			});
		},
		
		publish: function(event) {
			
			// target may not actually prevent click events, so double check
			var disabled = $(event.target).closest("a").attr("disabled");
			if (disabled) {
				return false;
			}
			var publishServiceUrl = appModel.get('publishServiceUrl');
			var pid = $(event.target).closest("a").attr("pid");
			var ret = confirm("Are you sure you want to publish " + pid + " with a DOI?");
			
			if (ret) {
				
				// show the loading icon
				var message = "Publishing package...please be patient";
				this.showLoading(message);
				
				var identifier = null;
				var viewRef = this;
				$.ajax({
						url: publishServiceUrl + pid,
						type: "PUT",
						xhrFields: {
							withCredentials: true
						},
						success: function(data, textStatus, xhr) {
							// the response should have new identifier in it
							identifier = $(data).find("d1\\:identifier, identifier").text();
						
							if (identifier) {
								viewRef.hideLoading();
								var msg = "Published package '" + identifier + "'";
								viewRef.$el.find('.container').prepend(
										viewRef.alertTemplate({
											msg: msg,
											classes: 'alert-success'
										})
								);
								
								// navigate to the new view after a few seconds
								setTimeout(
										function() {
											// avoid a double fade out/in
											viewRef.$el.html('');
											viewRef.showLoading();
											uiRouter.navigate("view/" + identifier, {trigger: true})
										}, 
										3000);
							}
						},
						error: function(xhr, textStatus, errorThrown) {
							// show the error message, but stay on the same page
							var msg = "Publish failed: " + $(xhr.responseText).find("description").text();
							
							viewRef.hideLoading();
							viewRef.$el.find('.container').prepend(
									viewRef.alertTemplate({
										msg: msg,
										classes: 'alert-error',
										includeEmail: true
									})
							);
						}
					}
				);
				
			}
		},
		
		// this will lookup the latest version of the PID
		showLatestVersion: function(pid, traversing) {
			if((typeof pid === "undefined") || !pid)
				var pid = this.pid || appModel.get("pid");
	
			var obsoletedBy = null,
				encodedPid = encodeURIComponent(pid);
			
			// look up the metadata service URL. It may be turned off
			var metaServiceUrl = appModel.get('metaServiceUrl');			
			if((typeof metaServiceUrl === "undefined") || !metaServiceUrl) return;
			
			// look up the meta
			var viewRef = this;
			$.get(metaServiceUrl + encodedPid, function(data, textStatus, xhr) {
						
				// the response should have a resourceMap element
				obsoletedBy = $(data).find("obsoletedBy").text();
						
				if (obsoletedBy) {						
					viewRef.showLatestVersion(obsoletedBy, true);
				} else {
					if (traversing) {
						viewRef.$el.find("#Metadata > .container").prepend(
								viewRef.versionTemplate({pid: pid})
						);			
					}		
				}
			});	
		},
		
		showLoading: function(message) {
			this.hideLoading();
			appView.scrollToTop();
			this.$el.prepend(this.loadingTemplate({msg: message}));
		},
		
		hideLoading: function() {
			$("#Notification").remove();
		},
		
		setUpAnnotator: function() {
			if(!appModel.get("annotatorUrl")) return;
			
			
			var annotator = new AnnotatorView({ 
				parentView: this 
				});
			this.subviews.push(annotator);
			annotator.render();
		},
		
		/**
		 * When the "Metadata" button in the table is clicked while we are on the Metadata view, 
		 * we want to scroll to the anchor tag of this data object within the page instead of navigating
		 * to the metadata page again, which refreshes the page and re-renders (more loading time)
		 **/
		previewData: function(e){
			//Don't go anywhere yet...
			e.preventDefault();
			
			//Get the target and id of the click
			var button = $(e.target);
			if(!$(button).hasClass("preview")) 
				button = $(button).parents("a.preview");

			if(button){
				var id = $(button).attr("data-id");
				if((typeof id === "undefined") || !id) 
					return false; //This will make the app defualt to the child view previewData function
			}
			else
				return false;
			
			//If we are on the Metadata view, then let's scroll to the anchor
			appView.scrollTo(this.findEntityDetailsContainer(id));	
			
			return true;
		},
		
		closePopovers: function(e){
			if($(e.target).hasClass("popover-this") || 
			  ($(e.target).parents(".popover-this").length > 0)  || 
			  ($(e.target).parents(".popover").length > 0) ||
			  $(e.target).hasClass("popover")) return;
			
			//Close all active popovers
			this.$(".popover-this.active").popover("hide");
		},
		
		highlightNode: function(e){
			//Find the id
			var id = $(e.target).attr("data-id");
			
			if((typeof id === "undefined") || (!id))
				id = $(e.target).parents("[data-id]").attr("data-id");
			
			//If there is no id, return
			if(typeof id === "undefined") return false;
			
			//Highlight its node
			$(".prov-chart .node[data-id='" + id + "']").toggleClass("active");
			
			//Highlight its metadata section
			if(appModel.get("pid") == id)
				this.$("#Metadata").toggleClass("active");
			else{
				var entityDetails = this.findEntityDetailsContainer(id);
				if(entityDetails)
					entityDetails.toggleClass("active");
			}
		},
		
		onClose: function () {			
			_.each(this.subviews, function(subview) {
				subview.onClose();
			});
			
			//Put the document title back to the default
			appModel.set("title", appModel.defaults.title);
			
			//Remove view-specific classes
			this.$el.removeClass("container no-stylesheet");
			
			this.$el.empty();
			
			this.pid = null;
		}
		
	});
	
	return MetadataView;		
});
