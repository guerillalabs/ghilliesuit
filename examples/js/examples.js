$(document).ready(function() {
    // the delegation is so the plugin functionality is attached to generated items or items that load on the page after this script first runs
    $('body').delegate('.modal', 'click', function(e) {
        if (!$(this).data('modal-init')) {
            e.preventDefault();
            $(this).data('modal-init', true).ghillie();
        }
    });
    $('body').delegate('.modal-large', 'click', function(e) {
        if (!$(this).data('modal-init')) {
            e.preventDefault();
            $(this).data('modal-init', true).ghillie({
                'extraClass' : 'large'
            });
        }
    });



    // this is only for testing the delegation of the functionality
    $('.create a').click(function() {
        $(this).parent().after('<a class="author modal" title="generated test title" href="#author3">Author 3</a>');
        return false;
    });
    // this is only for testing a remote hide of the modal
    $('body').delegate('.hide a', 'click', function(e) {
        e.preventDefault();
        $(this).closest('.'+$.fn.ghillie.defaults.modalWrap).ghillie('hide');
    });
});