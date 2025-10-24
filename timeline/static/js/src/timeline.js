/* Javascript for TimelineXBlock. */
function TimelineXBlock(runtime, element) {
    const uniqueId = $(element).find('.timeline-container').data('unique-id');
    const container = $(element).find(`#timeline-${uniqueId}`);
    let timeline;

    const handleKeys = (item = null) => (event) => {
        if (!timeline) return;
        switch (event.key) {
            case 'Enter':
                if (item) {
                    timeline.setSelection(item.id);
                    showItemDetails(item);
                }
                break;
            case 'ArrowRight': {
                let { start, end } = timeline.getWindow();
                timeline.setWindow(
                  vis.moment(start).add(1, 'week'),
                  vis.moment(end).add(1, 'week'),
                );
                break;
            }
            case 'ArrowLeft': {
                let { start, end } = timeline.getWindow();
                timeline.setWindow(
                  vis.moment(start).subtract(1, 'week'),
                  vis.moment(end).subtract(1, 'week'),
                );
                break;
            }
            case '+':
                timeline.zoomIn(0.05);
                break;
            case '-':
                timeline.zoomOut(0.05);
                break;
            case '=':
                timeline.fit();
                break;
        }
    };
    container.on('keydown', handleKeys());

    const itemTemplate = (item) => {
        return $(`<div class="event-item" tabindex="0" role="tab" aria-expanded="false" aria-describedby="timeline-media-${uniqueId}">`)
          .html(`${item.content} <span class="event-date sr-only">Date ${item.start.toLocaleDateString()}</span>`)
          .on('keydown', handleKeys(item))[0];
    };

    function processDataItems(data) {
        data.forEach(item => {
            item.start = vis.moment(item.start);
            if (item.milestone) {
                item.className = 'milestone';
            } else {
                item.className = 'event';
            }
        });
        return new vis.DataSet(data);
    }

    function showItemDetails(selectedItem) {
        const mediaContainer = $(element).find(`#timeline-media-${uniqueId}`);
        mediaContainer.empty();

        const title = $('<h2>').text(selectedItem.content);
        const description = $('<div>').html(selectedItem.description);
        mediaContainer.append(title, description);
        mediaContainer.show();
    }

    $(function ($) { // Ensure the DOM is fully loaded
        $.ajax({
            type: "POST",
            url: runtime.handlerUrl(element, 'get_timeline_data'),
            data: JSON.stringify({}),
            contentType: "application/json",
            success: function(data) {
                if (!container[0]) {
                    console.error("Timeline container not found");
                    return;
                }
                const items = processDataItems(fakeData);
                const options = {
                    order: (a, b) => a.start - b.start,
                    template: itemTemplate,
                };
                timeline = new vis.Timeline(container[0], items, options);

                timeline.on('select', function(properties) {
                    if (properties.items.length > 0) {
                        const selectedItem = items.get(properties.items[0]);
                        showItemDetails(selectedItem);
                        container.find('.event-item').attr('aria-expanded', 'false');
                        properties.event.target.attr('aria-expanded', 'true');
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error("Error fetching data: ", error);
            }
        });
    });
}
