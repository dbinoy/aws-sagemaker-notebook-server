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

            var linkbutton = $('<button type="button" class="btn btn-info btn-lg" data-toggle="modal" data-target="#notebookModal" name='+notebookinstances[i]['NotebookInstanceName']+'>Open Notebook</button>').click( function () { 
                var $this = $(this);
                str = $this.attr('name')
                generateurlfornotebook(str.substring(str.search(" ")+1))
            });
            $("#notebooks > tbody:last-child > tr:last").append('<td></td>').find("td:last").append(linkbutton);     
        }        
    }

    function generateurlfornotebook(instancename) {
        $(".modal-title").text("Notebook Instance : " + instancename) 
        $(".modal-body").text("")
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/generateurlfornotebook',
            headers: {
                Authorization: authToken
            },
            data:{
                InstanceName: instancename
            },
            contentType: 'application/json',
            success: opennotebook,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error generating pre-signed URL: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error generating pre-signed URL:\n' + jqXHR.responseText);
            }
        });
    }

    function opennotebook(result) {
        statuscode = JSON.parse(result['statusCode']);
        if (statuscode == '200') {
            instanceurl = JSON.parse(result['body']);
            $(".modal-body").text("URL : " + instanceurl)
            //$(".modal-body").html('<object data='+instanceurl+'/>');
            window.open(instanceurl)
        } else {
            instanceurl = JSON.parse(result['body'])['Message']
            $(".modal-body").text("Error : " + instanceurl)
        }
        console.log('Response received from API: ', result);        
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
