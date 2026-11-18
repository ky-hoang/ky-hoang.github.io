/*
  Your experience, skills and awards. Experience shows on the home page,
  so recruiters see it without opening your résumé; skills and awards show
  on the About page. Keep this in step with public/resume.pdf.

  To add a job: copy one of the entries in `experience` and edit it.
  Newest first. Leave `end` as "" for a job you still have.
*/

export const experience = [
  {
    role: "Operations Specialist",
    org: "Apple",
    place: "San Jose, CA",
    start: "Jan 2026",
    end: "",
    note: "Processed 2,766 internal support requests in a quarter, the team's highest volume, at 99% on time against a two-minute target.",
  },
  {
    role: "Volunteer Data 8 Tutor",
    org: "UC Berkeley",
    place: "Berkeley, CA",
    start: "Aug 2023",
    end: "Dec 2023",
    note: "Tutored 30+ students in Python-based data analysis.",
  },
];

export const skills = [
  { group: "Languages", items: ["Java", "Python", "TypeScript", "Swift", "SQL", "HTML/CSS"] },
  { group: "Frameworks and libraries", items: ["React", "FastAPI", "Flask", "SwiftUI", "scikit-learn", "NumPy"] },
  { group: "Tools and databases", items: ["Git", "GitHub Actions", "SQLite", "ChromaDB", "pytest", "JUnit", "Xcode"] },
];

export const awards = [
  { name: "Human Impact Track Winner", from: "Innovation Intelligence Hackathon at UC Berkeley", year: "2026" },
  { name: "Eagle Scout", from: "Boy Scouts of America", year: "2019" },
];
