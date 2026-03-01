const Resume = () => {
  const resumeUrl = `${import.meta.env.BASE_URL}Aneesh_Resume.pdf`;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-5xl px-4 py-6 flex items-center justify-between">
        <a
          href="/"
          className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          ← Back
        </a>
        <a
          href={resumeUrl}
          download
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
        >
          Download PDF
        </a>
      </div>
      <iframe
        src={resumeUrl}
        title="Resume"
        className="w-full max-w-5xl flex-1 min-h-[85vh] rounded-lg border border-border"
      />
    </div>
  );
};

export default Resume;
