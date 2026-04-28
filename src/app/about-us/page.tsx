"use client";

import { ArrowRight, HeartHandshake, Leaf, ShieldCheck, Sprout, Target } from "lucide-react";

const team = ["Ronita", "Indrani", "Rudraj", "Deepak"];

export default function AboutUsPage() {
  return (
    <div className="min-h-full bg-gray-50 px-4 py-5 transition-colors duration-200 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_28%)]" />
          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Leaf className="h-4 w-4" />
              About Agri Bot
            </div>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl">
              A practical offline agriculture support system designed for safer crop monitoring and smarter field decisions.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600 dark:text-gray-400 sm:text-base">
              Agri Bot is our final-year project focused on combining Raspberry Pi, ESP32, Pi camera,
              live sensing, and AI-based detection into one simple field-ready platform that can work
              even without internet access.
            </p>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Objectives</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-gray-600 dark:text-gray-400 sm:text-base">
              <li>Provide offline crop monitoring through a Raspberry Pi and ESP32 hotspot setup.</li>
              <li>Help farmers view soil, temperature, humidity, and threat-related information more clearly.</li>
              <li>Support both manual control and autonomous replay from one practical interface.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Motivation</h2>
            <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-400 sm:text-base">
              We wanted to build a system that does more than just collect data. The motivation behind
              Agri Bot is to make field monitoring easier, more visual, and more useful for real user
              situations where internet access, time, and attention are limited.
            </p>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Focus</h2>
            <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-400 sm:text-base">
              The project focuses on real-time field safety, simplified notifications, AI-assisted
              threat detection, and better decision support using local hardware that can be carried
              directly into the field.
            </p>
          </section>
        </div>

        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                <Sprout className="h-4 w-4" />
                Team
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Meet the Team
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Final Year Project Team
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {team.map((member, index) => (
              <div
                key={member}
                className="group rounded-3xl border border-gray-200 bg-gray-50 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg dark:border-gray-800 dark:bg-gray-950/60 dark:hover:border-emerald-500/20 dark:hover:bg-gray-900"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/20">
                  {member.charAt(0)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{member}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Team Member {index + 1} contributing to the design, implementation, and development of Agri Bot.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <span>Agri Bot Team</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
