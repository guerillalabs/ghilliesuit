(function($){
    var methods = {
        init : function(options) {
            // use settings to hold the default class names of the modal elements we'll be creating later
            var settings = {
                'modalWrap'     : 'modal_message',
                'modalHead'     : 'modal_header',
                'modalBody'     : 'modal_body',
                'modalFoot'     : 'modal_footer',
                'backdrop'      : 'modal_overlay'
            };

            // we're going to use an array for all of our variables so we can easily pass them from method to method
            var vars = {
                'link'          : $(this).attr('href'),
                'title'         : $(this).attr('title'),
                'rel'           : $(this).attr('rel'),
                'modalData'     : $(this).data(),
                '$modal'        : '',
                '$backdrop'     : ''
            }

            return this.each(function() {
                // if options exist, lets merge them with our default settings
                if (options) {
                    $.extend(settings, options);
                }

                // the function that controls the logic for what happens next
                function modalLogic(e) {
                    if (e) {
                        e.preventDefault();
                    }

                    // first, let's assign the modal box (if it exists) to a variable
                    vars.$modal = $('.'+settings.modalWrap+'[rel="'+vars.link+'"]').filter('[data-modal_life="'+vars.modalData.modal_life+'"]');

                    // if the modal already exists, let's fire the toggle method (we're relying on the url being set as the rel value for the modal in the build method to tie the link and the modal box together - we're also making sure the modal_life data attribute is the same as the link to keep the different types of modals segregated)
                    if (vars.$modal.length) {
                        $(this).lwModal('toggle', settings, vars);

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

                // start building the modal box
                vars.$modal = $('<div class="'+settings.modalWrap+'" rel="'+vars.link+'" data-modal_life="'+vars.modalData.modal_life+'" style="display:none;"></div>');

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
                    vars.$backdrop = $('.'+settings.backdrop);
                    if (!vars.$backdrop.length) {
                        vars.$modal.lwModal('backdropCreate', settings, vars);
                    }

                    // fire the show function as the last step of the build
                    vars.$modal.lwModal('show', settings, vars);
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

                // bind click functionality for close buttons
                vars.$modal.find(".close a, a.close").bind('click.modal', function(e) {
                    e.preventDefault();

                    if (vars.modalData.modal_life && vars.modalData.modal_life.toLowerCase() === 'persist') {
                        vars.$modal.lwModal('hide', vars);
                    } else {
                        vars.$modal.lwModal('hide', vars, 'remove');
                    }
                });
            });
        },
        toggle : function(settings, vars) {
            return this.each(function() {
                // check to see if it is visible
                // if it is, do the logic for hiding or removing it
                if (vars.$modal.is(':visible')) {
                    if (vars.modalData.modal_life && vars.modalData.modal_life.toLowerCase() === 'persist') {
                        vars.$modal.lwModal('hide', vars);
                    } else {
                        vars.$modal.lwModal('hide', vars, 'remove');
                    }

                // if it's not visible, let's fire the show function
                } else {
                    vars.$modal.lwModal('show', settings, vars);
                }
            });
        },
        show : function(settings, vars) {
            return this.each(function() {
                // first, let's toggle any currently visible modal boxes
                $('.'+settings.modalWrap).filter(':visible').each(function() {
                    if ($(this).data('modal_life') && $(this).data('modal_life').toLowerCase() === 'persist') {
                        $(this).lwModal('hide', vars);
                    } else {
                        $(this).lwModal('hide', vars, 'remove');
                    }
                });
                // then, let's remove and currently visible loading graphics
                $('.loading').lwModal('loadingRemove');

                // then, turn on the backdrop
                vars.$backdrop.lwModal('backdropShow');

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
                $(this).fadeIn();
            });
        },
        hide : function(vars, remove) {
            return this.each(function() {
                // first, turn off the backdrop
                vars.$backdrop.lwModal('backdropHide');

                // then, hide the modal
                $(this).fadeOut(400, function() {
                    if (remove) {
                        $(this).remove();
                    }
                });
            });
        },
        backdropCreate : function(settings, vars) {
            return this.each(function() {
                // build the backdrop
                vars.$backdrop = $('<div class="'+settings.backdrop+'" style="display:none;"></div>');

                // insert the backdrop
                vars.$backdrop.insertBefore(this);

                // setup behavior so that a click on the backdrop hides the visible modal
                vars.$backdrop.click(function() {
                    $('.'+settings.modalWrap).filter(':visible').each(function() {
                        if ($(this).data('modal_life') && $(this).data('modal_life').toLowerCase() === 'persist') {
                            $(this).lwModal('hide', vars);
                        } else {
                            $(this).lwModal('hide', vars, 'remove');
                        }
                    });
                });
            });
        },
        backdropShow : function() {
            return this.each(function() {
                $(this).css({
                    height: $(document).height()
                }).fadeIn();
            });
        },
        backdropHide : function() {
            return this.each(function() {
                $(this).fadeOut(400);
            });
        },
        loadingCreate : function() {
            return this.each(function() {
                $('<div class="loading" style="display:none;"></div>').appendTo('body').fadeIn(1500);
            });
        },
        loadingRemove: function() {
            return this.each(function() {
                $(this).stop().remove();
            });
        }
    };

    $.fn.lwModal = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.lwModal');
        }
    };
})(jQuery);


jQuery(document).ready(function() {
    jQuery('body').delegate('.modal', 'click', function(e) {
        if (!jQuery(this).data('modal-init')) {
            e.preventDefault();
            jQuery(this).data('modal-init', true).lwModal();
        }
    });



    // this is only for testing the delegation of the functionality
    jQuery('.create a').click(function() {
        jQuery(this).parent().after('<a class="author modal" data-modal-life="" title="generated test title" href="#author2">Jane L. Doe</a>');
        return false;
    });
});
