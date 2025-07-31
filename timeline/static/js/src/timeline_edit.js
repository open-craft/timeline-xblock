function TimelineXBlockEdit(runtime, element) {
    const timelineItems = fetchTimelineData();
    let currentEditIndex = -1;
    const titleCharacterLimit = 25;
    let currentTabIndex = 0;
    let initialSelectionMade = false;

    const tabs = [
        $(element).find('.basic-settings-tab'),
        $(element).find('.styling-settings-tab'),
        $(element).find('.timeline-editor')
    ];

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
            const title = item.content || `Item (${index + 1})`;
            const displayTitle = title.length > titleCharacterLimit ? title.substring(0, titleCharacterLimit) + '...' : title;
            const listItem = $(`
                <li data-index="${index}" style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="timeline-item-list-title">${displayTitle}</span>
                    <span class="icon fa fa-trash-o delete-timeline-item"></span>
                </li>
            `);
            listContainer.append(listItem);
        });

        if (!initialSelectionMade && timelineItems.length > 0) {
            listContainer.find('li:first').addClass('selected');
            renderTimelineItemDetails(0);
            initialSelectionMade = true;
        }
    }

    function renderTimelineItemDetails(index) {
        if (tinymce.activeEditor) {
            tinymce.activeEditor.remove();
        }
        tinymce.baseURL = baseUrl + "js/vendor/tinymce/js/tinymce";
        tinymce.init({ 
            selector: '#timeline-item-description',
            plugins: 'image media link',
            toolbar: 'image media link',
            menubar: 'edit format insert',
            theme: 'silver',
            skin: 'studio-tmce5',
            content_css: 'studio-tmce5',
            schema: 'html5',
            convert_urls: false,
            external_plugins: {
                'image': baseUrl + "js/vendor/tinymce/js/tinymce/" + "plugins/image/plugin.min.js",
                'media': baseUrl + "js/vendor/tinymce/js/tinymce/plugins/media/plugin.min.js",
                'link': baseUrl + "js/vendor/tinymce/js/tinymce/plugins/link/plugin.min.js",
            },
            setup: function (editor) {
                editor.on('init', function () {
                    console.log('TinyMCE Editor initialized.');
                    const item = timelineItems[index];
                    editor.setContent(item.description);
                });
                editor.on('change', function () {
                    saveTimelineItemData();
                })
            }
        });
        const errorMessageContainer = $(element).find('.error-message');
        errorMessageContainer.hide().text('');
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
        return timelineItems.filter(item => item.content && item.start);
    }

    function showTab(index) {
        tabs.forEach((tab, idx) => {
            tab.toggleClass('hidden', idx !== index);
        });
        $(element).find('.back-button').toggleClass('hidden', index === 0);
        $(element).find('.continue-button').toggleClass('hidden', index === tabs.length - 1);
        $(element).find('.save-button').parent().toggleClass('hidden', index !== tabs.length - 1);
    }

    function saveTimelineItemData() {
        const errorMessageContainer = $(element).find('.error-message');
        errorMessageContainer.hide().text('');

        if (currentEditIndex >= 0) {
            const title = $(element).find('#timeline-item-content').val();
            const date = $(element).find('#timeline-item-date').val();

            if (title && date) {
                timelineItems[currentEditIndex].start = date;
                timelineItems[currentEditIndex].content = title;
                timelineItems[currentEditIndex].description = tinymce.get('timeline-item-description').getContent();
                timelineItems[currentEditIndex].milestone = $(element).find('.timeline-item-milestone').prop('checked');
                renderTimelineItemList();
            } else {
                errorMessageContainer.text('Title and Date are required.').show();
                errorMessageContainer[0].scrollIntoView({ behavior: 'smooth' });
            }
        }
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

    $(element).on('input change', '#timeline-item-date, #timeline-item-content, .timeline-item-milestone', function() {
        saveTimelineItemData();
    });

    $(element).find('.continue-button').bind('click', function() {
        if (currentTabIndex < tabs.length - 1) {
            currentTabIndex++;
            showTab(currentTabIndex);
        }
    });

    $(element).find('.back-button').bind('click', function() {
        if (currentTabIndex > 0) {
            currentTabIndex--;
            showTab(currentTabIndex);
        }
    });

    $(element).on('click', '.delete-timeline-item', function() {
        const index = $(this).parent().data('index');
        timelineItems.splice(index, 1);
        renderTimelineItemList();
        $(element).find('.timeline-item-details').hide();
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

    showTab(currentTabIndex);
}
