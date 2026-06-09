import { HomepageTemplateEditor } from "./HomepageTemplateEditor";

export default function HomepageTemplatePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Global Homepage Template</h2>
      <p className="text-sm text-slate-400">
        Defines minimum fields and default styling for all schools. Does not overwrite
        school-specific content.
      </p>
      <HomepageTemplateEditor />
    </div>
  );
}
