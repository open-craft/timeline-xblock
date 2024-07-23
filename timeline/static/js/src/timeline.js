/* Javascript for TimelineXBlock. */
function TimelineXBlock(runtime, element) {
    const uniqueId = $(element).find('.timeline-container').data('unique-id');
    $(function ($) { // Ensure the DOM is fully loaded
        $.ajax({
            type: "POST",
            url: runtime.handlerUrl(element, 'get_timeline_data'),
            data: JSON.stringify({}),
            contentType: "application/json",
            success: function(data) {
                const container = $(element).find(`#timeline-${uniqueId}`)[0];
                if (!container) {
                    console.error("Timeline container not found");
                    return;
                }
                data.forEach(item => {
                    if (item.milestone) {
                        item.className = 'milestone';
                    } else {
                        item.className = 'event';
                    }
                });
                var items = new vis.DataSet(data);
                var options = {};
                var timeline = new vis.Timeline(container, items, options);

                timeline.on('select', function(properties) {
                    if (properties.items.length > 0) {
                        const selectedItem = items.get(properties.items[0]);
                        const mediaContainer = $(element).find(`#timeline-media-${uniqueId}`);
                        mediaContainer.empty();
    
                        const title = $('<h2>').text(selectedItem.content);
                        const description = $('<div>').html(selectedItem.description);
                        mediaContainer.append(title, description);
    
                        mediaContainer.show();
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error("Error fetching data: ", error);
            }
        });
    });
}
