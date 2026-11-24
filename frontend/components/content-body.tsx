import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Block = { heading?: string; lines: string[] };

/** 「## 見出し」で区切り、「- 」で始まる行を箇条書きとして表示する（HTML は解釈しない） */
function toBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let current: Block = { lines: [] };
  for (const line of body.split("\n")) {
    if (line.startsWith("## ")) {
      if (current.heading || current.lines.some((l) => l.trim())) blocks.push(current);
      current = { heading: line.slice(3).trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.heading || current.lines.some((l) => l.trim())) blocks.push(current);
  return blocks;
}

function Lines({ lines }: { lines: string[] }) {
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="list-disc space-y-1 pl-5">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const line of lines) {
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
    } else {
      flush();
      if (line.trim()) out.push(<p key={`p-${out.length}`}>{line}</p>);
    }
  }
  flush();
  return <>{out}</>;
}

export function ContentBody({ body }: { body: string }) {
  if (!body.trim()) return null;
  return (
    <div className="space-y-4">
      {toBlocks(body).map((block, i) => (
        <Card key={i}>
          {block.heading && (
            <CardHeader>
              <CardTitle className="text-lg">{block.heading}</CardTitle>
            </CardHeader>
          )}
          <CardContent className={`space-y-2 text-sm leading-relaxed ${block.heading ? "" : "pt-6"}`}>
            <Lines lines={block.lines} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
