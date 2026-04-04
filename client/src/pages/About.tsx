import { Building, MapPin, Phone, Mail, Globe, Target, Eye, Heart, Users } from 'lucide-react';

export default function About() {
  const directors = [
    { name: 'Dr. Sarah Johnson', role: 'School Director', initials: 'SJ' },
    { name: 'Mr. James Williams', role: 'Academic Director', initials: 'JW' },
    { name: 'Mrs. Emily Brown', role: 'Administrative Director', initials: 'EB' },
  ];

  const staff = [
    { name: 'Ms. Rachel Green', role: 'Head Teacher', initials: 'RG' },
    { name: 'Mr. David Chen', role: 'Science Coordinator', initials: 'DC' },
    { name: 'Mrs. Lisa Anderson', role: 'English Coordinator', initials: 'LA' },
    { name: 'Mr. Michael Peters', role: 'Mathematics Coordinator', initials: 'MP' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center max-w-3xl mx-auto">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary-500 flex items-center justify-center mb-6">
          <Building size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">About Our School</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-4">
          Empowering students to achieve excellence through quality education and holistic development since 2005.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Target size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold">Our Mission</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            To provide a nurturing and inclusive learning environment that empowers students to become 
            confident, creative, and compassionate individuals prepared to face the challenges of a 
            rapidly changing world.
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Eye size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-bold">Our Vision</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            To be a leading educational institution that cultivates academic excellence, character 
            development, and innovation, producing well-rounded graduates who contribute positively 
            to society.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold">Core Values</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Heart, label: 'Integrity', color: 'text-red-500' },
              { icon: Users, label: 'Teamwork', color: 'text-blue-500' },
              { icon: Target, label: 'Excellence', color: 'text-yellow-500' },
              { icon: Globe, label: 'Innovation', color: 'text-green-500' },
            ].map((value, idx) => (
              <div key={idx} className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <value.icon size={28} className={`mx-auto mb-2 ${value.color}`} />
                <p className="font-medium text-slate-800 dark:text-white">{value.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold">School Leadership</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {directors.map((person, idx) => (
              <div key={idx} className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{person.initials}</span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{person.name}</h3>
                <p className="text-sm text-slate-500">{person.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold">Teaching Staff</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {staff.map((person, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-slate-600 dark:text-slate-400">{person.initials}</span>
                </div>
                <h3 className="font-medium text-slate-800 dark:text-white">{person.name}</h3>
                <p className="text-xs text-slate-500">{person.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold">Contact Information</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-slate-400 mt-1" />
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Address</p>
                <p className="text-slate-500">123 Education Street, Knowledge City</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={20} className="text-slate-400 mt-1" />
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Phone</p>
                <p className="text-slate-500">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={20} className="text-slate-400 mt-1" />
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Email</p>
                <p className="text-slate-500">info@myschool.edu</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe size={20} className="text-slate-400 mt-1" />
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Website</p>
                <p className="text-slate-500">www.myschool.edu</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-8 border-t border-slate-200 dark:border-slate-700">
        <p className="text-slate-500">
          Powered by <span className="font-semibold text-primary-500">Schofy</span> - School Management System
        </p>
      </div>
    </div>
  );
}
