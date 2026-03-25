/* Javascript for TimelineXBlock. */
function TimelineXBlock(runtime, element) {
    $(function ($) { // Ensure the DOM is fully loaded
        $.ajax({
            type: "POST",
            url: runtime.handlerUrl(element, 'get_timeline_data'),
            data: JSON.stringify({}),
            contentType: "application/json",
            success: function (data) {
                const events = data.map((item) => {
                    const date = new Date(item.start);
                    return ({
                        start_date: {
                            year: date.getFullYear(),
                            month: date.getMonth() + 1,
                            day: date.getDate(),
                        },
                        text: {
                            headline: item.content,
                            text: item.description,
                        },
                    });
                });

                const options = {
                    hash_bookmark: true,
                    scale_factor: 0.5
                };
                const timeline = new TL.Timeline(
                  'timeline-embed',
                  { events },
                  options,
                );
                window.timeline = timeline;
                timeline.on('ready', function (data) {
                    setTimeout(() => {
                        timeline._timenav._el.slider.style.left = '50px';
                    }, 0);
                });
            },
            error: function (xhr, status, error) {
                console.error("Error fetching data: ", error);
            },
        });
    });
}
