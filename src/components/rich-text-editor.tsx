'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, Pilcrow, List, ListOrdered, Quote, Undo, Redo, Minus, Underline as UnderlineIcon, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const menuItems = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive('bold') },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive('italic') },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive('underline') },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive('strike') },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), isActive: editor.isActive('code') },
    { icon: SubscriptIcon, action: () => editor.chain().focus().toggleSubscript().run(), isActive: editor.isActive('subscript') },
    { icon: SuperscriptIcon, action: () => editor.chain().focus().toggleSuperscript().run(), isActive: editor.isActive('superscript') },
    { isSeparator: true },
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive('heading', { level: 1 }) },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }) },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive('heading', { level: 3 }) },
    { icon: Pilcrow, action: () => editor.chain().focus().setParagraph().run(), isActive: editor.isActive('paragraph') },
    { isSeparator: true },
    { icon: AlignLeft, action: () => editor.chain().focus().setTextAlign('left').run(), isActive: editor.isActive({ textAlign: 'left' }) },
    { icon: AlignCenter, action: () => editor.chain().focus().setTextAlign('center').run(), isActive: editor.isActive({ textAlign: 'center' }) },
    { icon: AlignRight, action: () => editor.chain().focus().setTextAlign('right').run(), isActive: editor.isActive({ textAlign: 'right' }) },
    { icon: AlignJustify, action: () => editor.chain().focus().setTextAlign('justify').run(), isActive: editor.isActive({ textAlign: 'justify' }) },
    { isSeparator: true },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive('bulletList') },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive('orderedList') },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive('blockquote') },
    { isSeparator: true },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), isActive: false },
    { isSeparator: true },
    { icon: Undo, action: () => editor.chain().focus().undo().run(), isActive: false },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), isActive: false },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border border-input bg-transparent rounded-t-md p-2">
      {menuItems.map((item, index) => (
        item.isSeparator ? 
          <div key={index} className="h-6 w-px bg-muted-foreground mx-1" /> :
          <button
            key={index}
            onClick={item.action}
            className={`p-2 rounded-md transition-colors ${item.isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
            aria-label={item.icon ? item.icon.displayName : ''}
          >
            {item.icon && <item.icon className="h-4 w-4" />}
          </button>
      ))}
    </div>
  );
};

interface RichTextEditorProps {
  initialContent?: string;
  onUpdate: (content: string) => void;
}

export const RichTextEditor = ({ initialContent, onUpdate }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent || '<p>Start writing your masterpiece...</p>',
    immediatelyRender: false, // <--- This is the fix
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none w-full focus:outline-none p-4 font-body text-base leading-relaxed',
      },
    },
  });

  return (
    <div className="border border-input rounded-md">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="min-h-[300px]" />
    </div>
  );
};
