import Link from "next/link"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0f0c20] text-white p-8 md:p-16">
            <div className="max-w-4xl mx-auto glass-card p-8 md:p-12 rounded-3xl border border-indigo-500/20 shadow-2xl">
                <div className="mb-10">
                    <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2 w-fit">
                        &larr; Back to Home
                    </Link>
                </div>

                <div className="border-b border-indigo-500/20 pb-8 mb-10">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-indigo-500 mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-white/60">Effect Date: October 1, 2024</p>
                </div>

                <div className="space-y-10 text-white/80 leading-relaxed max-w-none">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">1. Agreement to Terms</h2>
                        <p>
                            By accessing or using CheckIt ("the Service", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">2. Description of Service</h2>
                        <p>
                            CheckIt is a productivity and task management platform that provides features including, but not limited to, task organization, kanban boards, calendar scheduling, 3D focus timers, and a voice assistant. We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice to you.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">3. User Accounts & Registration</h2>
                        <ul className="list-disc pl-6 space-y-2 text-white/70">
                            <li>You must be at least 13 years old to use the Service.</li>
                            <li>You must provide accurate, complete, and current registration information.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You agree to accept responsibility for any and all activities or actions that occur under your account.</li>
                            <li>You must immediately notify us upon becoming aware of any breach of security or unauthorized use of your account.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">4. Acceptable Use Policy</h2>
                        <p>You agree not to use the Service to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70">
                            <li>Violate any applicable national or international law or regulation.</li>
                            <li>Transmit or store malicious code, viruses, or harmful payloads.</li>
                            <li>Attempt to gain unauthorized access to the Service, other users' accounts, or our underlying infrastructure.</li>
                            <li>Engage in automated scraping, data mining, or payload generation that disproportionately burdens our infrastructure.</li>
                            <li>Harass, abuse, or engage in malicious behavior towards other users via the collaborative task-sharing features.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">5. User Content & Data</h2>
                        <p>
                            "User Content" refers to the tasks, categories, lists, calendar events, and any other data you input into the Service.
                            You retain full ownership of all User Content. By utilizing the Service, you grant us a worldwide, non-exclusive, royalty-free license to host, store, and process your User Content solely for the purpose of operating, rendering, and providing the Service to you (e.g., displaying your tasks on a shared Kanban board when you explicitly authorize sharing).
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">6. Third-Party Integrations</h2>
                        <p>
                            The Service incorporates third-party features (such as Youtube/Spotify embeds for Focus Mode and browser Web Speech APIs for the Voice Assistant). Your use of these embedded services is subject to their respective terms of service and privacy policies. We do not control and assume no responsibility for the content, privacy policies, or practices of any third-party web sites or services.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">7. Intellectual Property</h2>
                        <p>
                            The Service and its original content (excluding User Content), features, visual design (including our custom 3D visualizations), and functionality are and will remain the exclusive property of CheckIt and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">8. Termination</h2>
                        <p>
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or delete your account through the Settings menu.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">9. Limitation of Liability</h2>
                        <p>
                            In no event shall CheckIt, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">10. "As Is" Disclaimer</h2>
                        <p>
                            Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">11. Changes to Terms</h2>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any material changes by posting the new Terms on this page and updating the "Effect Date" at the top of these Terms. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
