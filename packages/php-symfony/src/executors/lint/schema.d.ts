export interface ReportScript {
  script: string;
  suffix: string;
}

export interface LintExecutorSchema {
  outputFile?: string;
  reportScripts?: ReportScript[];
}
