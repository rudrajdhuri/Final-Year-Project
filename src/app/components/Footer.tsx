// "use client";

// import { Instagram, Youtube, Github, Linkedin, Mail, Phone, MapPin, Leaf } from "lucide-react";

// const Footer = () => {
//   const year = new Date().getFullYear();

//   const socialLinks = [
//     { icon: Instagram, href: "https://www.instagram.com/_agribot_/",                          label: "Instagram" },
//     { icon: Github,    href: "https://github.com/rudrajdhuri/Final-Year-Project",             label: "GitHub" },
//     { icon: Youtube,   href: "https://www.youtube.com/@ieeexpert4921",                        label: "YouTube" },
//     { icon: Linkedin,  href: "https://www.linkedin.com/in/rudraj-dhuri-7b7544269/",           label: "LinkedIn" },
//   ];

//   const contactDetails = [
//     { icon: MapPin, text: "Goa College of Engineering, Farmagudi, Ponda, Goa - 403401" },
//     { icon: Phone,  text: "+91 73851 56351",       href: "tel:+917385156351" },
//     { icon: Mail,   text: "rudrajdhuri@gmail.com", href: "mailto:rudrajdhuri@gmail.com" },
//   ];

//   return (
//     <footer className="
//       bg-gray-900 dark:bg-gray-950
//       text-gray-300 dark:text-gray-300
//       border-t border-gray-700 dark:border-gray-800
//       transition-colors duration-200
//     ">
//       <div className="max-w-6xl mx-auto px-6 py-8">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

//           {/* Brand */}
//           <div className="space-y-3 flex flex-col items-center md:items-start">
//             <div className="flex items-center gap-2">
//               <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
//                 <Leaf className="w-4 h-4 text-white" />
//               </div>
//               <span className="text-lg font-bold text-white">AGRI BOT</span>
//             </div>
//             <p className="text-sm text-gray-400 text-center md:text-left max-w-xs leading-relaxed">
//               An intelligent agricultural monitoring system using deep learning for animal threat detection and plant disease classification — built for Indian farmers.
//             </p>
//             <p className="text-xs text-gray-500 text-center md:text-left">
//               Final Year Project · Goa College of Engineering · 2026
//             </p>
//           </div>

//           {/* Contact */}
//           <div className="space-y-3 flex flex-col items-center md:items-start">
//             <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Contact</h4>
//             <ul className="space-y-2.5">
//               {contactDetails.map((d, i) => (
//                 <li key={i} className="flex items-start gap-3">
//                   <d.icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
//                   {d.href ? (
//                     <a href={d.href} className="text-xs text-gray-400 hover:text-emerald-400 transition-colors leading-relaxed">
//                       {d.text}
//                     </a>
//                   ) : (
//                     <span className="text-xs text-gray-400 leading-relaxed">{d.text}</span>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* Social */}
//           <div className="space-y-3 flex flex-col items-center md:items-end">
//             <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Follow</h4>
//             <div className="flex gap-3">
//               {socialLinks.map((link, i) => (
//                 <a
//                   key={i}
//                   href={link.href}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   aria-label={link.label}
//                   className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-600 dark:border-gray-700 text-gray-400 hover:text-white hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-200"
//                 >
//                   <link.icon className="w-4 h-4" />
//                 </a>
//               ))}
//             </div>
//             <p className="text-xs text-gray-500 text-center md:text-right max-w-[180px]">
//               Stay updated with our latest research and deployments.
//             </p>
//           </div>
//         </div>

//         {/* Bottom bar */}
//         <div className="mt-6 pt-4 border-t border-gray-700 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
//           <p>&copy; {year} AgriBot. All Rights Reserved.</p>
//           <p>Built with Next.js · Flask · PyTorch · MongoDB</p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;


"use client";

import { Instagram, Youtube, Github, Linkedin, Mail, Phone, MapPin, Leaf } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();

  const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/_agribot_/",                          label: "Instagram" },
    { icon: Github,    href: "https://github.com/rudrajdhuri/Final-Year-Project",             label: "GitHub" },
    { icon: Youtube,   href: "https://www.youtube.com/@ieeexpert4921",                        label: "YouTube" },
    { icon: Linkedin,  href: "https://www.linkedin.com/in/rudraj-dhuri-7b7544269/",           label: "LinkedIn" },
  ];

  const contactDetails = [
    { icon: MapPin, text: "Goa College of Engineering, Farmagudi, Ponda, Goa - 403401" },
    { icon: Phone,  text: "+91 73851 56351",       href: "tel:+917385156351" },
    { icon: Mail,   text: "rudrajdhuri@gmail.com", href: "mailto:rudrajdhuri@gmail.com" },
  ];

  return (
    <footer className="
      bg-gray-100 dark:bg-gray-950
      text-gray-600 dark:text-gray-300
      border-t border-gray-200 dark:border-gray-800
      transition-colors duration-200
    ">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div className="space-y-3 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">AGRI BOT</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left max-w-xs leading-relaxed">
              An intelligent agricultural monitoring system using deep learning for animal threat detection and plant disease classification — built for Indian farmers.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center md:text-left">
              Final Year Project · Goa College of Engineering · 2026
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-3 flex flex-col items-center md:items-start">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2.5">
              {contactDetails.map((d, i) => (
                <li key={i} className="flex items-start gap-3">
                  <d.icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {d.href ? (
                    <a href={d.href} className="text-xs text-gray-400 hover:text-emerald-400 transition-colors leading-relaxed">
                      {d.text}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 leading-relaxed">{d.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-3 flex flex-col items-center md:items-end">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Follow</h4>
            <div className="flex gap-3">
              {socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-white hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-200"
                >
                  <link.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center md:text-right max-w-[180px]">
              Stay updated with our latest research and deployments.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p className="text-gray-400 dark:text-gray-500">&copy; {year} AgriBot. All Rights Reserved.</p>
          <p className="text-gray-400 dark:text-gray-500">Built with Next.js · Flask · PyTorch · MongoDB</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;