$(document).ready(function () {
    
    var source = $('#event-template').html();
    var eventTemplate = Handlebars.compile(source);

    $.each(events,function (index,event) {
        var eventUI = eventTemplate(event);
        var date = event['date'];
        $('#calendar').find('.date-block[data-date="'+date+'"]').find('.events').append(eventUI);
    });


    var panel = {
        el: '#info-panel',
        selectedDateBlock:null,
        selectedEvent:null,
        init:function (isNew,e) {
            
            panel.clear();
            
            panel.updateDate(e);
            
            if (isNew) {
                $(panel.el).addClass('new').removeClass('update');
                panel.selectedDateBlock = $(e.currentTarget);
            }
            else{
                $(panel.el).addClass('update').removeClass('new');
                panel.selectedDateBlock = $(e.currentTarget).closest('date-block');
                
            }
        },
        clear:function () {
            $(panel.el).find('input').val('');
            $(panel.el).find('textarea').val('');
        },
        open: function (isNew, e) {
            panel.init(isNew,e);
            panel.hideError();

            $(panel.el).addClass('open').css({
                top: e.pageY + 'px',
                left: e.pageX + 'px',
            }).find('.title [contenteditable]').focus();          
            
            
        },
        close:function () {
            $(panel.el).removeClass('open');
        },
        updateDate:function (e) {
          if ($(e.currentTarget).is('.date-block'))
            var date = $(e.currentTarget).data('date');
          else
            var date = $(e.currentTarget).closest('.date-block').data('date');
        
        var year =  $('#calendar').data('year');
        var month = $('#calendar').data('month');
        
        $(panel.el).find('.month').text(month);
        $(panel.el).find('.date').text(date);
        $(panel.el).find('[name="year"]').val(year);
        $(panel.el).find('[name="month"]').val(month);
        $(panel.el).find('[name="date"]').val(date);
        
        },
        showError:function (msg) {
          $(panel.el).find('.error-msg').addClass('open')
            .find('.alert').text(msg);
        },
        hideError:function () {
            $(panel.el).find('.error-msg').removeClass('open')
        },
    };

    $('.date-block')
        .dblclick(function (e) {
            panel.open(true, e);
        }).on('dblclick', '.event', function (e) {
            e.stopPropagation();
            panel.open(false, e);

            panel.selectedEvent = $(e.currentTarget);

            var id =$(this).data('id');
            //todo
            //ajax call - get event detail
            $.post("event/read.php", {id:id},
                    function (data, textStatus, jqXHR) {
                        $(panel.el).find('[name="id"]').val(data.id);
                        $(panel.el).find('[name="title"]').val(data.title);
                        $(panel.el).find('[name="start_time"]').val(data.start_time);
                        $(panel.el).find('[name="end_time"]').val(data.end_time);
                        $(panel.el).find('[name="description"]').val(data.description);
                    }).fail(function (xhr) {
                        panel.showError(xhr.responseText);
                    })
            //load detail back to panel
        });


    $(panel.el)
        .on('click', 'button', function (e) {
            if ($(this).is('.create') || $(this).is('.update')) {
                if ($(this).is('.create'))
                    var action ='event/create.php'
                if ($(this).is('.update'))
                    var action = 'event/update.php'

                //collect data
                var data = $(panel.el).find('form').serialize();    

                //ajax call - create  api
                $.post(action, data)
                    .done(function (data, textStatus, jqXHR) {   
                        if ($(e.currentTarget).is('.update'))
                            panel.selectedEvent.remove();

                        var eventUI = eventTemplate(data);
                        
                        panel.selectedDateBlock.find('.event').each(function (index,event) {
                            var eventFromTime = $(event).data('from').split(':');//10:00 > ['10','00']
                            var newEventFromTime = data.start_time.split(':');
                            if(eventFromTime[0]>newEventFromTime[0] ||
                                (eventFromTime[0]==newEventFromTime[0]  && eventFromTime[1]>newEventFromTime[1])) {
                                $(event).before(eventUI);
                                return false;
                            }
                        });

                        if(panel.selectedDateBlock.find('.event[data-id="'+data.id+'"]').length==0)
                            panel.selectedDateBlock.find('.events').append(eventUI);

                        panel.close();
                    })
                    .fail(function (xhr,textStatus,errorThrown) {
                        panel.showError(xhr.responseText);
                });

            }

            if ($(this).is('.cancel')) {
                panel.close();
            }

            if ($(this).is('.delete')) {
                var result = confirm('Do you really want to delete this event?')
                if(result){
                    var id = panel.selectedEvent.data('id');
                    $.post("event/delete.php", {id:id})
                    .done(function () {
                        panel.selectedEvent.remove();
                        panel.close();
                    });
                }
            }
        })
        .on('click', '.close', function (e) {
            $('button.cancel').click();
        });


});