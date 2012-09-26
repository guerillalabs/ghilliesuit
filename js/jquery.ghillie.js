(function($){
    var methods = {
        init : function(options) {
            // we're going to use an array for all of our variables so we can easily pass them from method to method
            var vars = {
                'link'          : $(this).attr('href'),
                'title'         : $(this).attr('title'),
                'rel'           : $(this).attr('rel'),
                'modalData'     : $(this).data(),
                '$modal'        : ''
            }

            return this.each(function() {
                // if options exist, lets merge them with our default settings
                var settings = $.extend({}, $.fn.ghillie.defaults, options);

                // the function that controls the logic for what happens next
                function modalLogic(e) {
                    if (e) {
                        e.preventDefault();
                    }

                    // first, let's assign the modal box (if it exists) to a variable
                    vars.$modal = $('.'+settings.modalWrap+'[rel="'+vars.link+'"]').filter('[data-modal_life="'+vars.modalData.modal_life+'"]');

                    // if the modal already exists, let's fire the toggle method (we're relying on the url being set as the rel value for the modal in the build method to tie the link and the modal box together - we're also making sure the modal_life data attribute is the same as the link to keep the different types of modals segregated)
                    if (vars.$modal.length) {
	                        $(this).ghillie('toggle', vars.$modal);

                    // if it doesn't already exist, let's build it
                    } else {
                        $(this).ghillie('build', settings, vars);
                    }
                }

                // fire the function to create the modal the first time through
                modalLogic();

                // now we'll bind a click event to fire the logic function on all following clicks
                $(this).bind('click.modal', modalLogic);
            });
        },
        build : function(settings, vars) {
            return this.each(function() {
                // go ahead and create and show the loading message (so it is in place while the modal is being created - especially important if the message comes from an external page)
                $(this).ghillie('loadingCreate');

                // see if there should be an extra class on the modal
                var extraClass = '';
                if (settings.extraClass) {
                    extraClass = ' ' + settings.extraClass;
                }
                // see if there should be a modal_life attribute on the modal
                var modalLife = '';
                if (vars.modalData.modal_life) {
	                modalLife = ' data-modal_life="' + vars.modalData.modal_life + '"'
                }
                // start building the modal box
                vars.$modal = $('<div class="'+settings.modalWrap+extraClass+'" rel="'+vars.link+'"'+modalLife+' data-modal_speed="'+settings.speed+'" style="display:none;"></div>');

                // add the modal to the document - we add it here so that dom events targeting the modal content fire correctly
                vars.$modal.appendTo('body');

                // assign all data elements from the calling link to the created modal (we'll use this for persistance rules and other settings later)
                vars.$modal.data(vars.modalData);

                // the function that puts all the pieces together and initiates display of the modal once everything has been loaded
                function modalLoadingComplete() {
                    // wrap the body of the modal
                    vars.$modal.wrapInner('<div class="'+settings.modalBody+'"></div>');

                    // do header/title stuff here
                    if (vars.title) {
                        vars.$modal.prepend('<div class="'+settings.modalHead+'"><h2 class="title">'+vars.title+'<span class="close close_button"><a href="#">&times;</a></span>'+'</h2></div>');
                    }

                    // do footer stuff here
                    if (!vars.title) {
                        vars.$modal.append('<div class="'+settings.modalFoot+'"><p class="close button"><a href="#">Close</a></p></div>');
                    }

                    // add bgiframe here (if available)
                    if (typeof($.fn.bgiframe) === 'function') {
                        vars.$modal.bgiframe();
                    }

                    // build the backdrop if it doesn't exist
                    // first, let's assign the backdrop to a variable
                    $.fn.ghillie.$backdrop = $('.'+settings.backdrop);
                    if (!$.fn.ghillie.$backdrop.length) {
                        vars.$modal.ghillie('backdropCreate', settings);
                    }

                    // fire the show function as the last step of the build
                    vars.$modal.ghillie('show', settings, vars);

                    // bind click functionality for close buttons
                    vars.$modal.find(".close a, a.close").bind('click.modal', function(e) {
                        e.preventDefault();
                        vars.$modal.ghillie('hide');
                    });
                }

                // add the target html to the modal body
                // look to see if the link is to an element in this page
                if (vars.link.match(/^#/i)) {
                    vars.$modal.append($(vars.link).html());
                    modalLoadingComplete();
                // Deal with external links
                } else {
                    // See if a target box ID is specified in the rel attribute of the link, and only load that box if it is
                    if (vars.rel) {
                        vars.$modal.load(vars.link+' #'+vars.rel, modalLoadingComplete);
                    } else {
                        vars.$modal.load(vars.link, modalLoadingComplete);
                    }
                }
            });
        },
        toggle : function(modal) {
            return this.each(function() {
                // check to see if it is visible
                // if it is, do the logic for hiding or removing it
                if (modal.is(':visible')) {
                    modal.ghillie('hide');
                // if it's not visible, let's fire the show function
                } else {
                    modal.ghillie('show');
                }
            });
        },
        show : function() {
            return this.each(function() {
                // first, let's hide any currently visible modal boxes
                $('.'+$.fn.ghillie.defaults.modalWrap).filter(':visible').each(function() {
                    $(this).ghillie('hide');
                });
                // then, let's remove and currently visible loading graphics
                $('.loading').ghillie('loadingRemove');

                // then, turn on the backdrop
                $.fn.ghillie.$backdrop.ghillie('backdropShow');

                // finally, display the modal
                var windowHeight = $(window).height();
                var modalHeight = $(this).outerHeight();
                // show the modal fixed if there is enough room
                if (modalHeight <= (windowHeight-20)) {
                    $(this).css({
                        'margin-top': '-'+modalHeight/2+'px',
                        position: 'fixed',
                        top: '50%'
                    });
                // position it absolutely if there isn't enough room
                } else {
                    var scrollHeight = $(document).scrollTop();
                    $(this).css({
                        'margin-top': '20px',
                        position: 'absolute',
                        top: scrollHeight
                    });
                }
                // fade the modal in
                // TODO: add setting for fadeIn speed, or make it css
                $(this).fadeIn($(this).data('modal_speed'));
            });
        },
        hide : function(remove) {
            return this.each(function() {
                // first, turn off the backdrop
                $.fn.ghillie.$backdrop.ghillie('backdropHide');

                // then, hide the modal
				$(this).fadeOut($(this).data('modal_speed'), function() {
					if ((!$(this).data('modal_life') || $(this).data('modal_life').toLowerCase() !== 'persist' || remove === 'remove') && remove !== 'persist') {
						$(this).remove();
					}
				});
            });
        },
        backdropCreate : function(settings) {
            return this.each(function() {
                // build the backdrop
                $.fn.ghillie.$backdrop = $('<div class="'+settings.backdrop+'" style="display:none;"></div>');

                // insert the backdrop
                $.fn.ghillie.$backdrop.insertBefore(this);

                // setup behavior so that a click on the backdrop hides the visible modal
                $.fn.ghillie.$backdrop.click(function() {
                    $('.'+settings.modalWrap).filter(':visible').each(function() {
                        $(this).ghillie('hide');
                    });
                });
            });
        },
        backdropShow : function() {
            return this.each(function() {
                $(this).css({
                    height: $(document).height()
                }).fadeIn($.fn.ghillie.defaults.speed);
            });
        },
        backdropHide : function() {
            return this.each(function() {
                $(this).fadeOut($.fn.ghillie.defaults.speed);
            });
        },
        loadingCreate : function() {
            return this.each(function() {
                $('<div class="loading" style="display:none;"></div>').appendTo('body').fadeIn($.fn.ghillie.defaults.speed);
            });
        },
        loadingRemove: function() {
            return this.each(function() {
                $(this).stop().remove();
            });
        }
    };

    $.fn.ghillie = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.ghillie');
        }
    };

    // Let's setup defaults that will be available to all of our methods
    // use settings to hold the default class names of the modal elements we'll be creating later
    $.fn.ghillie.defaults = {
        'modalWrap'     : 'modal_message',
        'modalHead'     : 'modal_header',
        'modalBody'     : 'modal_body',
        'modalFoot'     : 'modal_footer',
        'backdrop'      : 'modal_overlay',
        'speed'         : 400,
        'extraClass'    : ''
    };
})(jQuery);