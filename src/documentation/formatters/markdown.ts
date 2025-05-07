import { DocumentationFormatter } from "../generator";

export class MarkdownFormatter implements DocumentationFormatter {
  formatDocumentation(title: string, content: string): string {
    return `# ${title}\n\n${content}`;
  }

  formatIndex(
    title: string,
    sections: { title: string; path: string }[]
  ): string {
    let result = `# ${title}\n\n## Índice\n\n`;

    for (const section of sections) {
      result += `- [${section.title}](${section.path})\n`;
    }

    return result;
  }

  getFileExtension(): string {
    return "md";
  }
}
