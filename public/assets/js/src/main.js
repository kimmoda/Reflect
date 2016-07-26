'use strict';
(function($) {
    $(document).ready(function() {
        // Global variables.
        var viewportWidth = $(window).width();
        var keywordInput = $('input[name="keyword"]');
        var submitKeywordButton = $('button[name="keyword"]');
        var currentFacebookUser = Cookies.get('Current_Facebook_User');

        // Auto type into search field for decoration.
        keywordInput.typed({
            strings: ["Snapbacks"],
            typeSpeed: 20
        });

        keywordInput.keypress(function(e) {
            if (e.which == 13) {
                retrieveProducts();
            }
        });

        submitKeywordButton.on('click', function() {
            retrieveProducts();
        });

        function retrieveProducts() {
            // Show ajax loader, hide all products.
            $('.pagination-wrapper').remove();
            $('#loader').show();
            $('.products').hide();
            // Ajax request.
            $.ajax({
                url: "http://localhost:3000/api/" + keywordInput.val(),
                method: "GET",
                success: function(data) {
                    // Hide ajax loader, show all products.
                    $('#loader').hide();
                    $('.products').show();

                    // Add new requested products to the DOM.
                    var allProducts = data;
                    var requestedData = '';
                    $('.products').empty();
                    for (var i = 0; i < allProducts.products.length; i++) {
                        var brandName = '';
                        if (currentFacebookUser != undefined) {
                            requestedData += '<div class="col-md-4"><div class="image-wrapper"><div class="vertically-align"><img src="' + allProducts.products[i].image.sizes.Best.url + '" alt="Product Image" /></div></div><p>' + allProducts.products[i].name + '</p><p>' + allProducts.products[i].priceLabel + ' | <a class="buy-link" href="' + allProducts.products[i].pageUrl + '"><b>Buy Now!</b></a></p><p><a href="#" class="wishlist">Add to Wishlist!</a></p></div>';
                        } else {
                            requestedData += '<div class="col-md-4"><div class="image-wrapper"><div class="vertically-align"><img src="' + allProducts.products[i].image.sizes.Best.url + '" alt="Product Image" /></div></div><p>' + allProducts.products[i].name + '</p><p>' + allProducts.products[i].priceLabel + ' | <a class="buy-link" href="' + allProducts.products[i].pageUrl + '">Buy Now!</a></p></div>';
                        }
                    }
                    $('.products').html(requestedData);

                    // Wrap every three products in a row.
                    var allProductElements = $('.products > div');
                    for (var i = 0; i < allProductElements.length; i += 3) {
                        allProductElements.slice(i, i + 3).wrapAll("<div class='row'></div>");
                    }

                    // Add zoom hover to product images.
                    $('.vertically-align > img').loupe();

                    // Remove previous pagination, and updated it for new requested products.
                    $('.products').easyPaginate({
                        paginateElement: $('.products > div'),
                        elementsPerPage: 3,
                        effect: 'default'
                    });
                    $('.easyPaginateNav').wrap('<div class="pagination-wrapper"></div>');
                    $('.easyPaginateNav a').on('click', function(e) {
                        e.preventDefault();
                    })
                    $('.pagination-wrapper').insertBefore('footer');
                },
                error: function(message) {
                    // Hide ajax loader.
                    $('#loader').hide();
                    console.log(message.statusText);
                }
            });
        }

        // Close wishlist modal.
        $('.close-modal').on('click', function() {
            $('.wishlist-wrapper').hide();
            $('body').removeClass('wishlist-open');
        });

        // Add pagination to products on initial load.
        $('.products').easyPaginate({
            paginateElement: $('.products > div'),
            elementsPerPage: 3,
            effect: 'default'
        });
        $('.easyPaginateNav').wrap('<div class="pagination-wrapper"></div>');
        $('.easyPaginateNav a').on('click', function(e) {
            e.preventDefault();
        })
        $('.pagination-wrapper').insertBefore('footer');

        // Add zoom hover to product images.
        $('.vertically-align > img').loupe();

        if (currentFacebookUser != undefined) {
            var userFirstName = currentFacebookUser.split(' ');
            var addToWishlist = $('.wishlist');
            var wishlistAnchor = $('.login-nav a');

            $('.login-nav').addClass('fb');
            wishlistAnchor.html('What\'s up ' + userFirstName[0] + '! <a href="#">Click here to check out your Wishlist!').attr('href', '#');
            addToWishlist.html('Add to Wishlist!');

            addToWishlist.on('click', function(e) {
                e.preventDefault();
                var wishlistParentWrapper = $(this).parent().parent();
                var wishlistData = {
                    wishListImage: wishlistParentWrapper.find('img').attr('src'),
                    wishListProduct: wishlistParentWrapper.find('.product-name').html(),
                    wishListProductPrice: wishlistParentWrapper.find('i').html(),
                    wishListProductUrl: wishlistParentWrapper.find('.buy-link').attr('href')
                }
                $.ajax({
                    url: "http://localhost:3000/api/add-wishlist",
                    method: "POST",
                    data: wishlistData,
                    success: function(data) {
                        console.log('Product pushed to Wishlist table.');
                    }
                });
            });

            wishlistAnchor.on('click', function() {
                $.ajax({
                    url: "http://localhost:3000/api/wishlist/get-wishlist",
                    method: "GET",
                    success: function(data) {
                        var wishlistMarkup = '';
                        if (data.length != 0) {
                            $('.no-items').hide();
                            for (var i = 0; i < data.length; i++) {
                                wishlistMarkup += '<tr data-id="' + data[i].id + '"><td><img style="max-width: 100px" src="' + data[i].product_image_src + '"></td><td><p>' + data[i].product_title + '</p><p><i>' + data[i].product_price + '</i><a href="' + data[i].product_url + '"> | <b>Buy Now</b></a></p><p class="remove-wishlist-item">Remove</p></td></tr>';
                            }
                        } else {
                            $('.no-items').show();
                        }

                        $('.wishlist-wrapper').show();
                        $('body').addClass('wishlist-open');
                        $('.wishlist-modal table tbody').html('');
                        $('.wishlist-modal table tbody').append(wishlistMarkup);
                    }
                }).then(function() {
                    var removeWishListItem = $('.remove-wishlist-item');
                    removeWishListItem.on('click', function() {
                        var wishlistItem = $(this).parent().parent();
                        var productID = $(this).parent().parent().data('id');
                        wishlistItem.remove();
                        if ($('.wishlist-modal table tbody tr').length == 0) {
                            $('.no-items').show();
                        }
                        $.ajax({
                            url: "http://localhost:3000/api/remove/wishlist/product",
                            method: "POST",
                            data: {
                                pid: productID
                            },
                            success: function(data) {
                                console.log('Product removed from Wishlist table.');
                            },
                            error: function(err) {
                                console.log(err);
                            }
                        });
                    });
                });
            });
        }
    });
})(jQuery);
