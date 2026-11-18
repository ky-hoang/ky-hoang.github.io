/*
  Your details. Everything here shows up across the site, so this is the
  one place to change your name, intro, or links.

  To add a link:    copy one of the lines inside `links` and edit it.
  To remove a link: delete its line.

  Your photo is not set here: it is the file src/content/profile.jpg.
*/

export const site = {
  // Shown in the top-left corner and in the browser tab
  name: "Ky Hoang",

  // The big hello at the top of the home page. A 👋 in it waves once
  // when the page opens.
  greeting: "Hi! I'm Ky 👋",

  // A few sentences under the greeting
  intro:
    "Data Science student at UC Berkeley, hackathon regular, and happiest building things that help people. I'm looking for software engineering internships. Below are a few things I've made, and a pond you can feed.",

  // One sentence about you for search results and link previews
  description:
    "Ky Hoang is a Data Science student at UC Berkeley who builds software that helps people, and is looking for software engineering internships.",

  // Shown as an Email link at the top of the home page and in the footer.
  // Leave as "" to hide it.
  email: "kyhoangg@berkeley.edu",

  // Put your résumé at public/resume.pdf, then set this to "/resume.pdf".
  // Leave as "" to hide the Résumé link.
  resume: "/resume.pdf",

  // Shown at the top of the home page and in the footer, in this order.
  // `icon` is one of: github, linkedin. Leave it out to get a plain link
  // icon. More can be added in src/components/Icon.astro.
  links: [
    { label: "GitHub", url: "https://github.com/ky-hoang", icon: "github" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/ky-m-hoang/", icon: "linkedin" },
  ],
};
