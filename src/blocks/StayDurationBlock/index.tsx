import type { Block } from 'payload'
import { StayDurationComponent } from "@/blocks/StayDurationBlock/StayDurationComponent"

export const StayDurationBlock: Block = {
  slug: "stayDuration",
  labels: {
    singular: "Stay Duration Block",
    plural: "Stay Duration Blocks",
  },
  fields: [
    {
      name: "defaultRate",
      type: "number",
      label: "Default Rate per Night",
      defaultValue: 150,
      required: true,
    },
    {
      name: "buttonLabel",
      type: "text",
      label: "Button Label",
      defaultValue: "Request Availability",
    },
  ],
  interfaceName: "StayDurationBlock",
} 