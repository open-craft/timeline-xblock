"""XBlock for displaying a customizable timeline."""
import json
import logging
import pkg_resources
from django.template import Context, Template
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Dict, String, Scope
from xblock.utils.studio_editable import StudioContainerXBlockMixin

logger = logging.getLogger(__name__)


@XBlock.wants('i18n')
class TimelineXBlock(XBlock, StudioContainerXBlockMixin):
    """
    XBlock to create and display a timeline with customizable items.
    """
    display_name = String(display_name="Display Name",
                          default="Timeline",
                          scope=Scope.settings,
                          help="Name of the component in the studio")

    title = String(display_name="Title",
                   default="",
                   scope=Scope.settings,
                   help="Title of the timeline")

    description = String(display_name="Description",
                         default="",
                         scope=Scope.settings,
                         help="Description of the timeline")

    data = Dict(display_name="Timeline Data",
                        default={"items": [
                                 {"id": 1, "content": "Item 1", "start": "2023-04-20", "description": "Description 1", "milestone": False},
                                 {"id": 2, "content": "Item 2", "start": "2023-04-14", "description": "Description 2", "milestone": True}
                             ]},
                        scope=Scope.content,
                        help="Data for the timeline")
    event_background_color = String(
        display_name="Event Background Color",
        default="#F0F6FA",
        scope=Scope.settings,
        help="Background color of default events on the timeline."
    )
    event_border_color = String(
        display_name="Event Border Color",
        default="#80B6D5",
        scope=Scope.settings,
        help="Border color of default events on the timeline."
    )
    event_text_color = String(
        display_name="Event Text Color",
        default="#000000",
        scope=Scope.settings,
        help="Text color of default events on the timeline."
    )
    milestone_background_color = String(
        display_name="Milestone Background Color",
        default="#4092BF",
        scope=Scope.settings,
        help="Background color of milestone events on the timeline."
    )
    milestone_border_color = String(
        display_name="Milestone Border Color",
        default="#FFFFFF",
        scope=Scope.settings,
        help="Border color of milestone events on the timeline."
    )
    milestone_text_color = String(
        display_name="Milestone Text Color",
        default="#FFFFFF",
        scope=Scope.settings,
        help="Text color of milestone events on the timeline."
    )


    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def author_view(self, context=None):
        """
        View shown to authors in Studio.
        """
        template_str = self.resource_string("static/html/author_view.html")
        template = Template(template_str)
        html = template.render(Context(context))
        frag = Fragment(html)
        return frag
    
    def student_view(self, context=None):
        """
        Primary view shown to students.
        """
        template_str = self.resource_string("static/html/timeline.html")
        template = Template(template_str)
        context = {
            "title": self.title,
            "description": self.description,
            "event_background_color": self.event_background_color,
            "event_border_color": self.event_border_color,
            "event_text_color": self.event_text_color,
            "milestone_background_color": self.milestone_background_color,
            "milestone_border_color": self.milestone_border_color,
            "milestone_text_color": self.milestone_text_color
        }
        html = template.render(Context(context))
        frag = Fragment(html)
        self.add_resources(frag)
        frag.initialize_js('TimelineXBlock')
        return frag
    
    def studio_view(self, context=None):
        """
        View shown to authors for editing in Studio.
        """
        template_str = self.resource_string("static/html/timeline_edit.html")
        template = Template(template_str)
        context = {
            "title": self.title,
            "description": self.description,
            "event_background_color": self.event_background_color,
            "event_border_color": self.event_border_color,
            "event_text_color": self.event_text_color,
            "milestone_background_color": self.milestone_background_color,
            "milestone_border_color": self.milestone_border_color,
            "milestone_text_color": self.milestone_text_color
        }
        html = template.render(Context(context))
        frag = Fragment(html)
        frag.add_css(self.resource_string("static/css/timeline.css"))
        frag.add_javascript(self.resource_string("static/js/src/timeline_edit.js"))
        frag.initialize_js('TimelineXBlockEdit')
        return frag

    def add_resources(self, frag):
        """
        Add CSS and JavaScript resources to the fragment.
        """
        frag.add_css(self.resource_string("static/css/timeline.css"))
        frag.add_javascript(self.resource_string("static/js/src/timeline.js"))

    @XBlock.json_handler
    def get_timeline_data(self, data, suffix=''):
        """
        Handler to get timeline data.
        """
        return self.data.get('items', [])
    
    @XBlock.json_handler
    def save_timeline(self, data, suffix=''):
        """
        Handler to save timeline data.
        """
        self.title = data.get('title', '')
        self.description = data.get('description', '')
        self.data = {"items": json.loads(data.get('timeline_data', '[]'))}
        self.event_background_color = data.get('event_background_color', self.event_background_color)
        self.event_border_color = data.get('event_border_color', self.event_border_color)
        self.event_text_color = data.get('event_text_color', self.event_text_color)
        self.milestone_background_color = data.get('milestone_background_color', self.milestone_background_color)
        self.milestone_border_color = data.get('milestone_border_color', self.milestone_border_color)
        self.milestone_text_color = data.get('milestone_text_color', self.milestone_text_color)
        return {"result": "success"}


    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("TimelineXBlock",
             """<timeline/>
             """),
            ("Multiple TimelineXBlock",
             """<vertical_demo>
                <timeline/>
                <timeline/>
                <timeline/>
                </vertical_demo>
             """),
        ]
