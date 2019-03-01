var NotebookServer = window.NotebookServer || {};
NotebookServer.app = NotebookServer.app || {};

(function NotebookScopeWrapper($) {
    var authToken;
    NotebookServer.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });
    function listNoteBooks() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/listnotebookinstances',
            headers: {
                Authorization: authToken
            },
            contentType: 'application/json',
            success: renderNoteBookList,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error listing Notebooks: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when listing Notebooks:\n' + jqXHR.responseText);
            }
        });
    }    
    function renderNoteBookList(result) {
        notebookinstances = JSON.parse(result['body'])
        console.log('Response received from API: ', notebookinstances);
        for (var i in notebookinstances) {
            notebookInstanceName = notebookinstances[i]['NotebookInstanceName']
            $('#notebooks > tbody:last-child').append('<tr><td>' + (parseInt(i)+1) + '.&nbsp;&nbsp;</td><td>' 
                                                                 + notebookinstances[i]['NotebookInstanceName'] + '&nbsp;&nbsp;</td><td>'
                                                                 + notebookinstances[i]['InstanceType'] +'&nbsp;&nbsp;</td><td>'
                                                                 + notebookinstances[i]['NotebookInstanceStatus'] +'&nbsp;&nbsp;</td></tr>');

            var linkbutton = $('<button>Open '+notebookinstances[i]['NotebookInstanceName']+'</button>').click( function () { 
                var $this = $(this);
                str = $this.text()
                alert(str.substring(str.search(" ")+1))
            });
            $("#notebooks > tbody:last-child > tr:last").append('<td></td>').find("td:last").append(linkbutton);                                                                            
        }        
    }

    function requestUnicorn(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        var unicorn;
        var pronoun;
        console.log('Response received from API: ', result);
        unicorn = result.Unicorn;
        pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
        displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is on ' + pronoun + ' way.');
    }

    // Register click handler for #request button
    $(function onDocReady() {
        listNoteBooks();
        $('#request').click(handleRequestClick);
        $('#signOut').click(function() {
            NotebookServer.signOut();
            alert("You have been signed out.");
            window.location = "signin.html";
        });
        $(NotebookServer.app).on('pickupChange', handlePickupChanged);

        NotebookServer.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Unicorn');
        requestButton.prop('disabled', false);
    }

    function handleRequestClick(event) {
        var pickupLocation = NotebookServer.app.selectedPoint;
        event.preventDefault();
        requestUnicorn(pickupLocation);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
}(jQuery));
