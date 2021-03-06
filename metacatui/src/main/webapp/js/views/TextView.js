/*global define */
define(['jquery', 'underscore', 'backbone', 
        'text!templates/alert.html',
        'text!templates/about.html',
        'text!templates/api.html',
        'text!templates/tools.html',
        'text!templates/help-searchTips.html'], 				
	function($, _, Backbone, AlertTemplate, AboutTemplate, APITemplate, ToolsTemplate, SearchTipsTemplate) {
	'use strict';
		
	// A generic view that loads a text template
	var TextView = Backbone.View.extend({

		el: '#Content',
		
		//Templates
		alert: _.template(AlertTemplate),
		about: _.template(AboutTemplate),
		api: _.template(APITemplate),
		tools: _.template(ToolsTemplate),
		searchTips: _.template(SearchTipsTemplate),
				
		initialize: function () {
		},
				
		render: function (options) {
			
			//Use a smaller header
			if(this.el == "#Content")
				appModel.set('headerType', 'default');
			
			//Get the text template from the options (sent from the router, most likely)
			var template = "";
			if(options && options.pageName){
				template = this[options.pageName];
			}
			
			//If there is no template of that name, display a 404 message
			if(!template){
				this.$el.html(this.alert({
					classes: "alert-error",
					msg: "Whoops, this page does not exist! Did you want to <a href='#data'>search for data</a> or learn <a href='#about'>more about this site</a>?"
				}));
			}
			
			if(options.pageName == "searchTips")
				var dataForTemplate = appSearchModel;
			
			//Load the text template
			this.$el.html(template({
				data: dataForTemplate
			}));
			
			return this;
		},
		
		postRender: function() {
			var anchorId = appModel.get('anchorId');
			if (anchorId) {
				this.scrollToAnchor(anchorId);
			} else {
				this.scrollToTop();
			}
		},

		// scroll to the anchor given to the render function
		scrollToAnchor: function(anchorId) {
			var anchorTag = $("a[name='" + anchorId + "']" );
			$('html,body').animate({scrollTop: anchorTag.offset().top}, 'slow');
		},
		
		// scroll to top of page
		scrollToTop: function() {
			$("html, body").animate({ scrollTop: 0 }, "slow");
			return false;
		}
		
	});
	return TextView;		
});
