/*global define */
define(['jquery',
				'underscore', 
				'jquerysidr',
				'backbone',
				'jws',
				'views/NavbarView',
				'views/AltHeaderView',
				'views/FooterView',
				'text!templates/alert.html',
				'text!templates/appHead.html',
				'text!templates/app.html',
				'text!templates/loading.html'
				], 				
	function($, _, jQuerySidr, Backbone, JWS, NavbarView, AltHeaderView, FooterView, AlertTemplate, AppHeadTemplate, AppTemplate, LoadingTemplate) {
	'use strict';
	
	var app = app || {};
	
	var theme = document.getElementById("loader").getAttribute("data-theme");
		
	// Our overall **AppView** is the top-level piece of UI.
	var AppView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '#metacatui-app',
		
		//Templates
		template: _.template(AppTemplate),
		alertTemplate: _.template(AlertTemplate),
		appHeadTemplate: _.template(AppHeadTemplate),
		loadingTemplate: _.template(LoadingTemplate),
		
		events: {
											 "click" : "closePopovers",
	 		                  'click .direct-search' : 'routeToMetadata',
		 	               'keypress .direct-search' : 'routeToMetadata',
		 	                 "click .toggle-slide"   : "toggleSlide"
			//'click #SignInLdap input[type="submit"]' : "submitLogin"

		},
				
		initialize: function () {
			//Change the document title when the app changes the appModel title at any time
			this.listenTo(appModel, "change:title", this.changeTitle);
			
			//Is there a logged-in user?
			appUserModel.checkStatus();

			// set up the head - make sure to prepend, otherwise the CSS may be out of order!			
			$("head").prepend(this.appHeadTemplate({theme: theme, themeTitle: themeTitle}));
									
			// set up the body
			this.$el.append(this.template());
			
			// render the nav
			app.navbarView = new NavbarView();
			app.navbarView.setElement($('#Navbar')).render();

			app.altHeaderView = new AltHeaderView();
			app.altHeaderView.setElement($('#HeaderContainer')).render();

			app.footerView = new FooterView();
			app.footerView.setElement($('#Footer')).render();
			
			// listen for image loading - bind only once in init method
			var imageEl = $('#bg_image');
			if ($(imageEl).length > 0) {
				// only show the image when it is completely done loading
				$(imageEl).load(function() {
					$(imageEl).fadeIn('slow');
				});
			}
		},
		
		//Changes the web document's title
		changeTitle: function(){
			document.title = appModel.get("title");
		},
				
		// Render the main view and/or re-render subviews. Don't call .html() here
		// so we don't lose state, rather use .setElement(). Delegate rendering 
		// and event handling to sub views
		render: function () {									
			return this;
		},
		
		// the currently rendered view
		currentView: null,
		
		// Our view switcher for the whole app
		showView: function(view, viewOptions) {			
			//reference to appView
			var thisAppViewRef = this;
	
			// Change the background image if there is one
			var imageEl = $('#bg_image');
			if ($(imageEl).length > 0) {
				
				var imgCnt = $(imageEl).attr('data-image-count');
				
				// hide the existing image
				$(imageEl).fadeOut('fast', function() {
					
					//Randomly choose the next background image
					var bgNum = Math.ceil(Math.random() * imgCnt);
					//If the element is an img, change the src attribute
					if ($(imageEl).prop('tagName') == 'IMG'){
						$(imageEl).attr('src', './js/themes/' + theme + '/img/backgrounds/bg' + bgNum + '.jpg');
						// note the load() callback will show this image for us
					}
					else { 
						//Otherwise, change the background image style property
						$(imageEl).css('background-image', 'url(\'./js/themes/' + theme + '/img/backgrounds/bg' + bgNum + '.jpg\')');
						$(imageEl).fadeIn('slow');
					}
					
				});
			}
		
			
			// close the current view
			if (this.currentView){
				// need reference to the old/current view for the callback method
				var oldView = this.currentView;
				
				this.currentView.$el.fadeOut('slow', function() {
					// clean up old view
					if (oldView.onClose)
						oldView.onClose();
					
					// render the new view
					view.$el.hide();
					view.render(viewOptions);
					view.$el.fadeIn('slow', function() {
						
						// after fade in, do postRender()
						if (view.postRender) {
							view.postRender();
						} else {
							// force scroll to top if no custom scrolling is implemented
							thisAppViewRef.scrollToTop();
						}
					});
				});
			} else {
				
				// just show the view without transition
				view.render(viewOptions);
				
			}
			
			// track the current view
			this.currentView = view;
		},	
		
		routeToMetadata: function(e){			
			//If the user pressed a key inside a text input, we only want to proceed if it was the Enter key
			if((e.type == "keypress") && (e.keycode != 13)) return;
			else if((e.type == "keypress") || ((e.type == "click") && (e.target.tagName == "BUTTON"))){
				e.preventDefault();

				//Get the value from the input element
				var form = $(e.target).attr("form") || null,
					val;
				
				if((e.target.tagName == "INPUT") && (e.target.type == "text")){
					val = $(e.target).val();
					$(e.target).val("");
				}
				else if(form){
					val = this.$("#" + form).find("input[type=text]").val();
					this.$("#" + form).find("input[type=text]").val("");
				}
				else
					return false;
				
				if(!val) return false;
				
				uiRouter.navigate('view/'+ encodeURIComponent(val), {trigger: true});
			}
		},
		
		showNewSearch: function(){
			// Clear the search and map model to start a fresh search
			appSearchModel.clear();
			appSearchModel.set(appSearchModel.defaults);
			mapModel.clear();
			mapModel.set(mapModel.defaults);
			
			//Clear the search history
			appModel.set("searchHistory", new Array());
			
			uiRouter.navigate('data', {trigger: true});
		},
		
		closePopovers: function(e){
			if(this.currentView && this.currentView.closePopovers)
				this.currentView.closePopovers(e);
		},
		
		// scroll to top of page
		scrollToTop: function() {
			$("body,html").stop(true,true) //stop first for it to work in FF
						  .animate({ scrollTop: 0 }, "slow");
			return false;
		},
		
		scrollTo: function(pageElement, offsetTop){
			//Find the header height if it is a fixed element
			var headerOffset = (this.$("#Header").css("position") == "fixed") ? this.$("#Header").outerHeight() : 0;
			
			$("body,html").stop(true,true) //stop first for it to work in FF
						  .animate({ scrollTop: $(pageElement).offset().top - 40 - headerOffset}, 1000);
			return false;
		},
		
		submitLogin: function(e){
			e.preventDefault();
			
			//Get the form element
			var form = $(e.target).parents("form");
			if(!form || !form[0]) return true;
			
			var view = this,
				username = form[0].username.value,
				pass = form[0].password.value,
				formContainer = form.parent(),
				loading = $(this.loadingTemplate({ msg: "Logging in..." }));
			
			//Remove any error messages from previous submissions
			formContainer.find(".alert-error").detach();
			
			//Show a loading screen
			formContainer.children().hide();			
			formContainer.prepend(loading);
						
			//Check that a username and password was entered
			if(!username){
				//Insert an error message
				form.before(this.alertTemplate({
					classes: "alert-error",
					msg: "Please enter a username."
				}));
				return;
			}
			if(!pass){
				//Insert an error message
				form.before(this.alertTemplate({
					classes: "alert-error",
					msg: "Please enter a password."
				}));
				return;
			}
			
			//Create the full username if the user didn't type it in				
			if (username.indexOf('=') < 0)
				form[0].username.value = 'uid=' + username + form[0].rdn.value;
			
			//Get the serialized form data
			var formData = form.serialize();

			/*
			 * This function will execute if a success from the login request is received
			 */
			var loginSuccess = function(ajax){
				//Take away the loading screen and show the form
				loading.detach();
			}
			
			/*
			 * This function will execute if a failure from the login request is received
			 */
			var loginFail = function(ajax){
				//Take away the loading screen and show the form
				loading.detach();
				formContainer.children().show();
				
				//Insert an error message
				form.before(view.alertTemplate({
					classes: "alert-error",
					msg: "Bad username, and/or password. Please try again."
				}));
			}
			
			//Send login request via the User Model
			appUserModel.loginLdap(formData, loginSuccess, loginFail);			
		},
		
		toggleSlide: function(e){
			if(!e || !e.target) return;
			
			e.preventDefault();
			
			var id = $(e.target).attr("data-toggle-el");
			$("#" + id).slideToggle();
		}
				
	});
	return AppView;		
});
