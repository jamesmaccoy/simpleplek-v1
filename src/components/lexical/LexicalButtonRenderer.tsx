// Suggested path: /Users/jamesmac/Documents/simpleplekv1/simpleplek-v1/src/components/lexical/LexicalButtonRenderer.tsx
// Or it could be part of your RichText component's internal serializers.
import React from 'react';

// This interface should match the structure of your link field in Payload
interface LinkField {
  type?: 'custom' | 'internal';
  url?: string;
  doc?: {
    relationTo: string;
    // 'value' could be an ID string or a populated object with at least a slug
    value: string | { slug?: string; [key: string]: any };
  };
  newTab?: boolean;
}

// This interface should match the 'fields' property of your Lexical button node
interface ButtonNodeFields {
  text: string;
  link: LinkField; // Assuming your button node has a 'link' field
  variant?: 'primary' | 'secondary'; // Optional: for different button styles
}

// Props for the renderer component; 'node' is passed by the Lexical serialization process
interface LexicalButtonRendererProps {
  node: {
    fields: ButtonNodeFields;
    // The 'type' string of your Lexical node, e.g., 'button', 'custom-button'
    // This is defined in your Payload Lexical editor configuration.
    type: string;
    // Other Lexical node properties might be present
  };
}

export const LexicalButtonRenderer: React.FC<LexicalButtonRendererProps> = ({ node }) => {
  const { text, link, variant } = node.fields;

  let href: string | undefined = undefined;

  if (link) {
    if (link.type === 'internal' && link.doc && link.doc.value) {
      const docValue = link.doc.value;
      // Handle populated document (object with slug)
      if (typeof docValue === 'object' && docValue.slug) {
        // Adjust path construction based on your routing for different collections
        if (link.doc.relationTo === 'posts') {
          href = `/posts/${docValue.slug}`;
        } else {
          // Default for 'pages' or other collections assumed to be at root
          href = `/${docValue.slug}`;
        }
      } else if (typeof docValue === 'string') {
        // Handle case where doc.value is an ID (less ideal for direct client-side URL construction without more info)
        // You might need a helper function to resolve IDs to paths, or ensure data is populated with slugs.
        console.warn(`Internal link for ${link.doc.relationTo} has ID ${docValue}, but slug is needed to form URL.`);
        // Example fallback if you have a consistent pattern like /collection/id
        // href = `/${link.doc.relationTo}/${docValue}`;
        href = '#internal-link-needs-slug-or-resolver';
      }
    } else if (link.type === 'custom' && link.url) {
      href = link.url;
    }
  }

  // Basic styling, you'll want to use your project's styling conventions (e.g., Tailwind CSS)
  const baseClasses = "py-2 px-4 rounded font-semibold transition-colors duration-150 ease-in-out inline-block text-center";
  let variantClasses = "";
  switch (variant) {
    case 'primary':
      variantClasses = "bg-blue-500 text-white hover:bg-blue-600";
      break;
    case 'secondary':
      variantClasses = "bg-gray-500 text-white hover:bg-gray-600";
      break;
    default:
      variantClasses = "bg-gray-200 text-gray-800 hover:bg-gray-300";
  }
  const buttonClasses = `${baseClasses} ${variantClasses}`;

  if (href) {
    return (
      <a
        href={href}
        className={buttonClasses}
        target={link?.newTab ? "_blank" : "_self"}
        rel={link?.newTab ? "noopener noreferrer" : ""}
      >
        {text || 'Button'}
      </a>
    );
  }

  // Fallback for a button without a valid link (e.g., display as disabled or plain text)
  // For accessibility, a button should ideally have an action or link.
  return (
    <div className={buttonClasses} role="button" aria-disabled="true">
      {text || 'Button (No Link)'}
    </div>
  );
};
