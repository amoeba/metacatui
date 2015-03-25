define(['jquery', 'underscore', 'backbone', 'views/ExpandCollapseListView', 'text!templates/provStatement.html'], 				
	function($, _, Backbone, ExpandCollapseList, ProvTemplate) {
	'use strict';

	/*
	 * Constructs a list of provenance statements based on the indexed prov fields of Solr documents.
	 * Renders a list of paragraph tags with sentences and links to the objects in the sentence.
	 * The Prov Statement template can be used to display other UI elements along with the textual prov statements.
	 */
	var ProvStatementView = Backbone.View.extend({
		
		/*
		 * OPTIONS
		 * model 	     : A SolrResult model that the statements are using as a context. The prov statements will call this model "this data" or "this image", etc.
		 * 		           Provenance traces that do not involve this model will not be displayed.
		 * relatedModels : an array of SolrResult models that this view will look through to find the prov trace. 
		 */
		initialize: function(options){
			if((options === undefined) || (!options)) var options = {};
			
			this.className       += options.className        || "";
			this.model		      = options.model		     || null;
			this.relatedModels    = options.relatedModels    || new Array();
			this.currentlyViewing = options.currentlyViewing || null;
			
			this.relatedModels = _.uniq(_.flatten(this.relatedModels));
		},
		
		template: _.template(ProvTemplate),
		
		tagName : "p",
		
		className : "provenance-statement-container",
		
		//Prov fields / predicates in the prov statements that we do not want to display
		skipPredicates: ["prov_generatedByExecution", 
		                 "prov_generatedByUser", 
		                 "prov_wasGeneratedBy", 
		                 "prov_usedByExecution", 
		                 "prov_usedByUser",
		                 "prov_wasExecutedByExecution",
		                 "prov_wasExecutedByUser"],
		
		/*
		 * Creates a provenance statement and inserts it into the template
		 */
		render: function(){
			//We need a SolrResult model in order to create a statement
			if(!this.model) return false;
			
			var view 	    = this,
				statementEl = $(document.createElement("div"));
			
			//Add the provenance statement HTML from the template
			this.$el.html(view.template());
			
			//Make a triple for each prov property
			function Triple(s, p, o){
				this.subject = s;
				this.predicate = p;
				this.object  = o;
			}
			var allTriples = new Array();
			
			//Make a list of predicates that we want to use in the prov statements
			var predicates = _.difference(searchModel.getProvFields(), this.skipPredicates);			
			
			//Look for prov traces in all the models
			var allModels = _.union(this.model, this.relatedModels);			
			
			_.each(allModels, function(model, i, list){
				_.each(predicates, function(p, ii){
					if((typeof model.get(p) !== "undefined") && model.get(p)){
						var predicateValues = model.get(p);
						_.each(predicateValues, function(value, iii){
							
							//Find a model in the "relatedModels" option if there is one that matches
							var modelFromID = _.find(view.relatedModels, function(m){ return(m.get("id") == value); }),
								tripleObject;
							
							if(typeof modelFromID === "undefined") tripleObject = value;
							else                                   tripleObject = modelFromID;
							
							if((typeof allTriples[p] === "undefined") || (!allTriples[p])) 
								allTriples[p] = new Array(new Triple(model, p, tripleObject));
							else
								allTriples[p].push(new Triple(model, p, tripleObject));							
						});
					}
				});				
			});
			
			//Basic info about our context model
			if(this.model.type == "Package")
				var noun = "package";
			else
				var noun = this.model.getType();
			
			var id = this.model.get("id");
			
			//Get a list of the predicates that we saved earlier
			var populatedPredicates = Object.keys(allTriples); 

			//Go through this array of triples, sorted by predicate
			_.each(populatedPredicates, function(predicate, i){
				//Start the statement/sentence when this model is the subject
				var subjStatementBegin = "This " + noun + " " + view.getPredicate(predicate),
					subjList		   = new Array();
				
				//State the statement/sentence when this model is the object
				var objStatementBegin = "This " + noun + " " + view.getPredicate(predicate, true),
					objList           = new Array();

				//Go through each triple type, based on predicate, in order to make prov statements
				_.each(allTriples[predicate], function(triple, ii){
					var type = "";
					
					//If the subject of this triple equals the id of this model, then structure the sentence as so
					if((triple.subject == id) || ((typeof triple.subject === "object") && (triple.subject.get("id") == id))){
						//Get information about the object of this triple
						var objectId = (typeof triple.object === "string") ? triple.object : triple.object.get("id");
						var objectModel = _.find(view.relatedModels, function(m){ 
							return(m.get("id") == objectId); 
						});
						
						//Get the type of object this is so we can make an icon out of it
						if(typeof objectModel !== "undefined") type = objectModel.getType();
						
						//Make a link out of the object ID
						subjList.push($(document.createElement("a"))
							                                .attr("href", appModel.get("objectServiceUrl") + objectId)
							                                .text(objectId)
				                                            .prepend(
						                                            $(document.createElement("i"))
						                                                      .attr("class", "icon " + view.getIconType(type))));
					}
					//If the object of this triple equals the id of this model, then structure the sentence as so
					else if((triple.object == id) || ((typeof triple.object === "object") && (triple.object.get("id") == id))){
						//Get information about the subject of this triple
						var subjectId = (typeof triple.subject === "string") ? triple.subject : triple.subject.get("id");
						var subjectModel = _.find(view.relatedModels, function(m){ 
							return(m.get("id") == subjectId); 
						});
						
						//Get the type of object this is so we can make an icon out of it
						if(typeof subjectModel !== "undefined") 
							type = subjectModel.getType();
						var icon = $(document.createElement("i")).attr("class", "icon " + view.getIconType(type));
						
						var linkText = $(document.createElement("span")).text(subjectId);
												
						//Make a link of the subject ID
						var link = $(document.createElement("a")).attr("href", appModel.get("objectServiceUrl") + subjectId).prepend(icon, linkText);
						
						//Is the subject the entity the user is currently viewing?
						if(view.currentlyViewing && (view.currentlyViewing.get("id") == subjectId)){
							var linkContainer = $(document.createElement("span")).prepend($(document.createElement("span")).text("the " + view.currentlyViewing.getType() + " you are currently viewing, "), link);
							objList.push(linkContainer);
						}
						else
							objList.push(link);
												                            
					}
				});
				
				//Add these statements to our element
				if(subjList.length > 0) $(statementEl).append(new ExpandCollapseList({list: subjList, prependText: subjStatementBegin, appendText: ". "}).render().el);
				if(objList.length > 0)  $(statementEl).append(new ExpandCollapseList({list: objList,  prependText: objStatementBegin, appendText: ". "}).render().el); 			
			});
			
			//Insert the list element into the DOM
			view.$el.find(".provenance-statement").append($(statementEl));
							
			return this;
		},
		
		/*
		 * Translates the prov field name into a plain-english label to use as the predicate in the prov statement
		 */
		getPredicate: function(provFieldName, inverse){
			if(typeof inverse === "undefined") var inverse = false;
			
			if(provFieldName == "prov_wasDerivedFrom"          && !inverse) return "was derived from ";
			else if(provFieldName == "prov_wasDerivedFrom"     && inverse)  return "was used as a source to create ";
			else if(provFieldName == "prov_generatedByProgram" && !inverse) return "was generated by the program ";
			else if(provFieldName == "prov_generatedByProgram" && inverse)  return "generated ";
			else if(provFieldName == "prov_usedByProgram"      && !inverse) return "was used by the program ";
			else if(provFieldName == "prov_usedByProgram"      && inverse)  return "used ";
			else return provFieldName + " ";
		},
		
		getIconType: function(type){
			if((typeof type === "undefined") || !type) 
				return "icon-table";
			else if(type == "program")
				return "icon-code";
			else if(type == "data")
				return "icon-table";
			else if(type == "metadata")
				return "icon-file-text";
			else if (type == "image")
				return "icon-picture";
			else if (type == "pdf")
				return "icon-file pdf";
			else if(type == "package")
				return "icon-folder-open";
		}
	});
	
	return ProvStatementView;		
});