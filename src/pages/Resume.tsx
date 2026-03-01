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
