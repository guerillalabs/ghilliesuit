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
                var settings = $.extend({}, $.fn.lwModal.defaults, options);

                // the function that controls the logic for what happens next
                function modalLogic(e) {
                    if (e) {
                        e.preventDefault();
                    }

                    // first, let's assign the modal box (if it exists) to a variable
                    vars.$modal = $('.'+settings.modalWrap+'[rel="'+vars.link+'"]').filter('[data-modal_life="'+vars.modalData.modal_life+'"]');

                    // if the modal already exists, let's fire the toggle method (we're relying on the url being set as the rel value for the modal in the build method to tie the link and the modal box together - we're also making sure the modal_life data attribute is the same as the link to keep the different types of modals segregated)
                    if (vars.$modal.length) {
                        $(this).lwModal('toggle', vars.$modal);

                    // if it doesn't already exist, let's build it
                    } else {
                        $(this).lwModal('build', settings, vars);
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
                $(this).lwModal('loadingCreate');

                // see if there should be an extra class on the modal
                var extraClass = '';
                if (settings.extraClass) {
                    extraClass = ' ' + settings.extraClass;
                }
                // start building the modal box
                vars.$modal = $('<div class="'+settings.modalWrap+extraClass+'" rel="'+vars.link+'" data-modal_life="'+vars.modalData.modal_life+'" data-modal_speed="'+settings.speed+'" style="display:none;"></div>');

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

                    // add the modal to the document
                    vars.$modal.appendTo('body');

                    // build the backdrop if it doesn't exist
                    // first, let's assign the backdrop to a variable
                    $.fn.lwModal.$backdrop = $('.'+settings.backdrop);
                    if (!$.fn.lwModal.$backdrop.length) {
                        vars.$modal.lwModal('backdropCreate', settings);
                    }

                    // fire the show function as the last step of the build
                    vars.$modal.lwModal('show', settings, vars);

                    // bind click functionality for close buttons
                    vars.$modal.find(".close a, a.close").bind('click.modal', function(e) {
                        e.preventDefault();
                        vars.$modal.lwModal('hide');
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
                    modal.lwModal('hide');
                // if it's not visible, let's fire the show function
                } else {
                    modal.lwModal('show');
                }
            });
        },
        show : function() {
            return this.each(function() {
                // first, let's hide any currently visible modal boxes
                $('.'+$.fn.lwModal.defaults.modalWrap).filter(':visible').each(function() {
                    $(this).lwModal('hide');
                });
                // then, let's remove and currently visible loading graphics
                $('.loading').lwModal('loadingRemove');

                // then, turn on the backdrop
                $.fn.lwModal.$backdrop.lwModal('backdropShow');

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
        hide : function() {
            return this.each(function() {
                // first, turn off the backdrop
                $.fn.lwModal.$backdrop.lwModal('backdropHide');

                // then, hide the modal
                $(this).fadeOut($(this).data('modal_speed'), function() {
                    if (!$(this).data('modal_life') || $(this).data('modal_life').toLowerCase() !== 'persist') {
                        $(this).remove();
                    }
                });
            });
        },
        backdropCreate : function(settings) {
            return this.each(function() {
                // build the backdrop
                $.fn.lwModal.$backdrop = $('<div class="'+settings.backdrop+'" style="display:none;"></div>');

                // insert the backdrop
                $.fn.lwModal.$backdrop.insertBefore(this);

                // setup behavior so that a click on the backdrop hides the visible modal
                $.fn.lwModal.$backdrop.click(function() {
                    $('.'+settings.modalWrap).filter(':visible').each(function() {
                        $(this).lwModal('hide');
                    });
                });
            });
        },
        backdropShow : function() {
            return this.each(function() {
                $(this).css({
                    height: $(document).height()
                }).fadeIn($.fn.lwModal.defaults.speed);
            });
        },
        backdropHide : function() {
            return this.each(function() {
                $(this).fadeOut($.fn.lwModal.defaults.speed);
            });
        },
        loadingCreate : function() {
            return this.each(function() {
                $('<div class="loading" style="display:none;"></div>').appendTo('body').fadeIn($.fn.lwModal.defaults.speed);
            });
        },
        loadingRemove: function() {
            return this.each(function() {
                $(this).stop().remove();
            });
        }
    };

    $.fn.glGhillie = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.glGhillie');
        }
    };

    // Let's setup defaults that will be available to all of our methods
    // use settings to hold the default class names of the modal elements we'll be creating later
    $.fn.glGhillie.defaults = {
        'modalWrap'     : 'modal_message',
        'modalHead'     : 'modal_header',
        'modalBody'     : 'modal_body',
        'modalFoot'     : 'modal_footer',
        'backdrop'      : 'modal_overlay',
        'speed'         : 400,
        'extraClass'    : ''
    };
})(jQuery);


jQuery(document).ready(function() {
    // the delegation is so the plugin functionality is attached to generated items or items that load on the page after this script first runs
    jQuery('body').delegate('.modal', 'click', function(e) {
        if (!jQuery(this).data('modal-init')) {
            e.preventDefault();
            jQuery(this).data('modal-init', true).glGhillie();
        }
    });
    jQuery('body').delegate('.modal-large', 'click', function(e) {
        if (!jQuery(this).data('modal-init')) {
            e.preventDefault();
            jQuery(this).data('modal-init', true).glGhillie({
                'extraClass' : 'large'
            });
        }
    });



    // this is only for testing the delegation of the functionality
    jQuery('.create a').click(function() {
        jQuery(this).parent().after('<a class="author modal" title="generated test title" href="#author3">Author 3</a>');
        return false;
    });
    // this is only for testing a remote hide of the modal
    jQuery('body').delegate('.hide a', 'click', function(e) {
        e.preventDefault();
        jQuery(this).closest('.'+$.fn.glGhillie.defaults.modalWrap).glGhillie('hide');
    });
});