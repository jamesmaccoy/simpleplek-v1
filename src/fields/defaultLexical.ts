import { Config } from 'payload'
import {
  BoldFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  lexicalEditor,
  UnderlineFeature,
} from '@payloadcms/richtext-lexical'

export const defaultLexical: Config['editor'] = lexicalEditor({
  features: () => {
    return [
      ParagraphFeature(),
      UnderlineFeature(),
      BoldFeature(),
      ItalicFeature(),
      LinkFeature({
        enabledCollections: ['pages', 'posts'],
        fields: ({ defaultFields }) => {
          const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
            if ('name' in field && field.name === 'url') return false
            return true
          })

          return [
            ...defaultFieldsWithoutUrl,
            {
              name: 'url',
              type: 'text',
              admin: {
                condition: ({ linkType }) => linkType !== 'internal',
              },
              label: ({ t }) => t('fields:enterURL'),
              required: true,
            },
            {
              name: 'appearance',
              type: 'select',
              defaultValue: 'default',
              options: [
                {
                  label: 'Default',
                  value: 'default',
                },
                {
                  label: 'Primary Button',
                  value: 'primary',
                },
              ],
              admin: {
                description: 'Choose how the link should be rendered.',
              },
            },
          ]
        },
      }),
    ]
  },
})
