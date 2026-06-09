import { jsPDF } from "jspdf";

export type HRCertificateData = {
  fullName: string;
  role: string;
  schoolName: string;
  seniority: string;
  educationLevel: string;
  education: string;
  detailedEducation?: string | null;
  joiningDate: string;
  experienceLevel: string;
  previousSchools?: string | null;
  totalYearsExperience?: string | null;
  jobHistory: string;
  positionsHeld?: string | null;
  certifications?: string | null;
  achievements?: string | null;
  skills?: string | null;
  age?: number | null;
  certificateNo: string;
  hrSignatureName: string;
  directorSignatureName: string;
  officialDate: string;
};

export function buildHRCertificatePdf(data: HRCertificateData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const isSenior = data.seniority.toUpperCase() === "SENIOR";

  doc.setDrawColor(30, 64, 120);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, 186, 273);

  doc.setFontSize(20);
  doc.setTextColor(30, 64, 120);
  doc.text("MATRIX IT SOLUTION", 105, 26, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Developed by Yeabsra Teffera", 105, 32, { align: "center" });

  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text("Sincerely Experience Certificate", 105, 44, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Certificate No: ${data.certificateNo}`, 18, 56);
  doc.text(`Official Date: ${data.officialDate}`, 18, 62);
  doc.text(`School: ${data.schoolName}`, 18, 68);

  let y = 82;
  const line = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 18, y);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(value || "—", 120);
    doc.text(wrapped, 58, y);
    y += Math.max(6, wrapped.length * 5);
  };

  line("Employee Name", data.fullName);
  line("Role", data.role);
  line("Experience Level", `${data.experienceLevel} (${data.seniority})`);
  line("Education Level", data.educationLevel);
  line("Education", data.education);
  line("Joining Date", data.joiningDate);

  if (isSenior) {
    if (data.detailedEducation) line("Detailed Education", data.detailedEducation);
    if (data.age) line("Age", String(data.age));
    if (data.totalYearsExperience)
      line("Total Experience", data.totalYearsExperience);
    if (data.previousSchools) line("Previous Schools", data.previousSchools);
    if (data.positionsHeld) line("Positions Held", data.positionsHeld);
    if (data.certifications) line("Certifications", data.certifications);
    if (data.achievements) line("Achievements", data.achievements);
    if (data.skills) line("Skills", data.skills);
    if (data.jobHistory) line("Full Job History", data.jobHistory);
  }

  drawOfficialStamp(doc, 155, Math.min(y + 25, 220));

  const signY = Math.min(y + 55, 240);
  doc.setDrawColor(30, 41, 59);
  doc.line(22, signY, 88, signY);
  doc.line(122, signY, 188, signY);
  doc.setFontSize(9);
  doc.text(data.hrSignatureName, 22, signY + 6);
  doc.text("HR Signature", 22, signY + 11);
  doc.text(data.directorSignatureName, 122, signY + 6);
  doc.text("Director Signature", 122, signY + 11);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "This certificate is auto-generated and officially issued by the school HR department.",
    105,
    278,
    { align: "center" }
  );

  return doc.output("arraybuffer");
}

function drawOfficialStamp(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(180, 30, 30);
  doc.setLineWidth(1.2);
  doc.circle(x, y, 16, "S");
  doc.setFontSize(7);
  doc.setTextColor(180, 30, 30);
  doc.text("OFFICIAL", x, y - 3, { align: "center" });
  doc.text("STAMP", x, y + 3, { align: "center" });
  doc.text("MATRIX", x, y + 9, { align: "center" });
}
