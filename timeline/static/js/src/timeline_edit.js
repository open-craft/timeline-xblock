function TimelineXBlockEdit(runtime, element) {
    const timelineItems = fetchTimelineData();
    let currentEditIndex = -1;
    const titleCharacterLimit = 20;

    function fetchTimelineData() {
        const items = [];
        $.ajax({
            type: "POST",
            url: runtime.handlerUrl(element, 'get_timeline_data'),
            data: JSON.stringify({}),
            contentType: "application/json",
            success: function(data) {
                console.log("Data fetched: ", data);
                items.push(...data);
                renderTimelineItemList();
            },
            error: function(xhr, status, error) {
                console.error("Error fetching data: ", error);
            }
        });
        return items;
    }

    function renderTimelineItemList() {
        const listContainer = $(element).find('.timeline-item-list');
        listContainer.empty();
        timelineItems.forEach((item, index) => {
            const title = item.content || 'Untitled timeline item';
            const displayTitle = title.length > titleCharacterLimit ? title.substring(0, titleCharacterLimit) + '...' : title;
            const listItem = $(`
                <li data-index="${index}">
                    <span class="timeline-item-list-title">${displayTitle}</span>
                </li>
            `);
            listContainer.append(listItem);
        });
    }

    function renderTimelineItemDetails(index) {
        if (tinymce.activeEditor) {
            tinymce.activeEditor.remove();
        }
        tinymce.baseURL = baseUrl + "js/vendor/tinymce/js/tinymce";
        tinymce.init({ 
            selector: '#timeline-item-description',
            plugins: 'image media',
            toolbar: 'image media',
            theme: 'silver',
            skin: 'studio-tmce5',
            content_css: 'studio-tmce5',
            schema: 'html5',
            convert_urls: false,
            external_plugins: {
                'image': baseUrl + "js/vendor/tinymce/js/tinymce/" + "plugins/image/plugin.min.js",
                'media': baseUrl + "js/vendor/tinymce/js/tinymce/plugins/media/plugin.min.js",
            },
            setup: function (editor) {
                editor.on('init', function () {
                    console.log('TinyMCE Editor initialized.');
                    const item = timelineItems[index];
                    editor.setContent(item.description);
                });
            }
        });
        currentEditIndex = index;
        const item = timelineItems[index];
        $(element).find('.timeline-item-title').text(`Item (${index + 1})`);
        $(element).find('#timeline-item-date').val(item.start);
        $(element).find('#timeline-item-content').val(item.content);
        $(element).find('#timeline-item-description').val(item.description);
        $(element).find('.timeline-item-milestone').prop('checked', !!item.milestone);
        $(element).find('.timeline-item-details').show();
    }

    function collectTimelineData() {
        return timelineItems;
    }

    $(element).on('click', '.timeline-item-list li', function() {
        const index = $(this).data('index');
        $(element).find('.timeline-item-list li').removeClass('selected');
        $(this).addClass('selected');
        renderTimelineItemDetails(index);
    });

    $(element).on('click', '.add-timeline-item', function() {
        const newItem = { content: '', start: '', description: '', milestone: false};
        timelineItems.push(newItem);
        renderTimelineItemList();
        renderTimelineItemDetails(timelineItems.length - 1);
    });

    $(element).on('click', '.save-timeline-item', function() {
        if (currentEditIndex >= 0) {
            timelineItems[currentEditIndex].start = $(element).find('#timeline-item-date').val();
            timelineItems[currentEditIndex].content = $(element).find('#timeline-item-content').val();
            timelineItems[currentEditIndex].description = tinymce.get('timeline-item-description').getContent();
            timelineItems[currentEditIndex].milestone = $(element).find('.timeline-item-milestone').prop('checked');
            renderTimelineItemList();
            $(element).find('.timeline-item-details').hide();
        }
    });

    $(element).find('.continue-button').bind('click', function() {
        $(element).find('.basic-settings-tab').addClass('hidden');
        $(element).find('.timeline-editor').removeClass('hidden');
        $(this).addClass('hidden');
        $(element).find('.save-button').parent().removeClass('hidden');
    });

    $(element).find('.save-button').bind('click', function() {
        const handlerUrl = runtime.handlerUrl(element, 'save_timeline');
        const data = {
            title: $(element).find('#timeline-title').val(),
            description: $(element).find('#timeline-description').val(),
            event_background_color: $(element).find('#event-background-color').val(),
            event_border_color: $(element).find('#event-border-color').val(),
            event_text_color: $(element).find('#event-text-color').val(),
            milestone_background_color: $(element).find('#milestone-background-color').val(),
            milestone_border_color: $(element).find('#milestone-border-color').val(),
            milestone_text_color: $(element).find('#milestone-text-color').val(),
            timeline_data: JSON.stringify(collectTimelineData())
        };
        if ('notify' in runtime) { //xblock workbench runtime does not have `notify` method
            runtime.notify('save', { state: 'start' });
        }

        $.ajax({
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(response) {
                if (response.result === "success") {
                    if ('notify' in runtime) { //xblock workbench runtime does not have `notify` method
                        runtime.notify('save', { state: 'end' });
                    }
                } else {
                    alert("Failed to save.");
                }
            }
        });
    });

    $(element).find('.cancel-button').bind('click', function () {
        if ('notify' in runtime) { //xblock workbench runtime does not have `notify` method
            runtime.notify('cancel', {});
        }
    });

    // Initial rendering
    renderTimelineItemList();
    if (timelineItems.length > 0) {
        renderTimelineItemDetails(0);
    } else {
        $(element).find('.timeline-item-details').hide();
    }
}
