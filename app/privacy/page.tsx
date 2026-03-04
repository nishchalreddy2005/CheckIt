import Link from "next/link"

export default function PrivacyPage() {
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
                        Privacy Policy
                    </h1>
                    <p className="text-white/60">Effect Date: October 1, 2024</p>
                </div>

                <div className="space-y-10 text-white/80 leading-relaxed max-w-none">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">1. Introduction</h2>
                        <p>
                            At CheckIt, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our application ("Service"). Please read this privacy policy carefully to understand what we do with your personal information.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">2. Information We Collect</h2>
                        <h3 className="text-lg font-semibold text-white/90 mt-2">Personal Data</h3>
                        <p>When you register for an account, we may collect personally identifiable information, such as your Name, Email address, and Username.</p>

                        <h3 className="text-lg font-semibold text-white/90 mt-4">Service Data</h3>
                        <p>We store the data you willingly provide to the application, including:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70">
                            <li>Tasks, descriptions, categories, and due dates.</li>
                            <li>Calendar event configurations and custom background preferences.</li>
                            <li>Focus session timers and statistics.</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-white/90 mt-4">Voice Assistant Data</h3>
                        <p>
                            If you use the Voice Assistant feature, your spoken commands are processed utilizing the Web Speech API (provided natively through your browser). We temporarily process the transcribed text on our servers to determine the appropriate application action (e.g., creating a task or navigating pages). <strong>We do not record, store, or sell your continuous voice audio.</strong> The transcription is discarded after the action is completed.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">3. How We Use Your Information</h2>
                        <p>We use the information we collect primarily to provide, maintain, and improve our services to you. Specific uses include:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70">
                            <li>Creating and managing your account securely.</li>
                            <li>Rendering your personalized 3D visualizations, Kanban boards, and Calendar views.</li>
                            <li>Delivering push notifications (if enabled) regarding task deadlines or timer completions.</li>
                            <li>Facilitating the multiplayer task-sharing feature when you explicitly add another user.</li>
                            <li>Monitoring and analyzing usage trends to improve application performance.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">4. Cookies, Local Storage & Tracking</h2>
                        <p>
                            We use standard browser features like Cookies, Local Storage, and IndexedDB to improve your experience. This includes keeping you logged in securely, remembering your PWA installation status, storing offline task queues before syncing, and maintaining your UI preferences (like dark mode or task sort order).
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">5. Data Sharing and Disclosure</h2>
                        <p>
                            We do not sell your personal data. We may share information with third parties only in the following situations:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70">
                            <li><strong>Service Providers:</strong> We may share data with trusted infrastructure providers (e.g., our database hosting providers) who assist us in operating our Service. They are bound by strict confidentiality agreements.</li>
                            <li><strong>User Consent:</strong> We share specific task data with other users when you specifically request it via the "Share Task" functionality.</li>
                            <li><strong>Legal Obligations:</strong> We may disclose information if required to do so by applicable law, court order, or government regulation.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">6. Data Retention and Deletion</h2>
                        <p>
                            We retain personal information we collect from you where we have an ongoing legitimate business need to do so (for example, to provide you with a service you have requested). You may delete your account and all associated data at any time via the Settings menu. Upon account deletion, all your tasks, preferences, and identifying information are permanently scrubbed from our active databases.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">7. Security of Your Data</h2>
                        <p>
                            We implement technical and organizational security measures to protect your data, including bcrypt password hashing, encrypted transit (HTTPS/SSL), and secure session validation. However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">8. Your Data Protection Rights</h2>
                        <p>Depending on your location (such as under GDPR or CCPA), you may have the following rights:</p>
                        <ul className="list-disc pl-6 space-y-2 text-white/70">
                            <li>The right to access, update or delete the information we have on you.</li>
                            <li>The right of rectification (to fix incorrect data).</li>
                            <li>The right to object to or restrict processing.</li>
                            <li>The right to data portability (exporting your tasks via our .ics or JSON export features).</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">9. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, your data, or our practices, please contact us.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
