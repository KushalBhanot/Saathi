import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface Props {
  children: string;
  color?: string;
}

/**
 * Lightweight markdown renderer — handles bold, bullets, and numbered lists.
 * No external dependencies, no layout bugs.
 */
export function SimpleMarkdown({ children, color = '#1C1917' }: Props) {
  const lines = children.split('\n');

  return (
    <View>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={i} style={{ height: 6 }} />;

        // Bullet list: lines starting with *, -, or •
        const bulletMatch = trimmed.match(/^[*\-•]\s+(.+)/);
        if (bulletMatch) {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color }]}>•</Text>
              <Text style={[styles.text, { color }]}>
                {renderInline(bulletMatch[1], color)}
              </Text>
            </View>
          );
        }

        // Numbered list: lines starting with 1. 2. etc.
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color }]}>
                {numberedMatch[1]}.
              </Text>
              <Text style={[styles.text, { color }]}>
                {renderInline(numberedMatch[2], color)}
              </Text>
            </View>
          );
        }

        // Normal paragraph
        return (
          <Text key={i} style={[styles.text, { color }]}>
            {renderInline(trimmed, color)}
          </Text>
        );
      })}
    </View>
  );
}

/**
 * Render inline **bold** and *italic* within a line.
 */
function renderInline(text: string, color: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold** or *italic*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(
        <Text key={key++} style={{ color }}>
          {text.slice(last, match.index)}
        </Text>,
      );
    }
    if (match[0].startsWith('**')) {
      parts.push(
        <Text key={key++} style={{ color, fontWeight: '700' }}>
          {match[2]}
        </Text>,
      );
    } else {
      parts.push(
        <Text key={key++} style={{ color, fontStyle: 'italic' }}>
          {match[3]}
        </Text>,
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(
      <Text key={key++} style={{ color }}>
        {text.slice(last)}
      </Text>,
    );
  }

  return parts;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 2,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    width: 16,
  },
});
