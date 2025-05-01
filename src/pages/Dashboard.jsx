import React, { useState } from 'react';

const sections = {
  'Beer Inventory': ['New Releases', 'Low Inventory', 'First In, First Out'],
  'Merch': ['New Stock', 'Low Inventory', 'Upcoming Items'],
  'Events': ['In House', 'External', 'Vendors', 'Food Trucks'],
  'Front of House': ['Square Updates', 'Soft Drinks/Snacks'],
  'Mug Club': [],
  'Promotions': [],
  'Bathrooms': [],
  'Brewery Visitors': [],
  'Staff': ['New Employees', 'Birthdays'],
  'News': [],
  'Job Listings': [],
  'TIPS Certification': [],
  'Upkeep': ['Downtime Tasks', 'Cleaning'],
  'Miscellaneous': [],
};

const content = {
  'New Releases': ['• Table Beer - last week', '• Pollock Rip - today 4/17', '• Spicy Pickle Beer - next week 4/23'],
  'Low Inventory': ['• Stonehorse logs (only one log left)', '• Floating Neutral Draft pulled for Pollock', '• Jandals Draft to be pulled next week for Pickle'],
  'First In, First Out': ['• Double check date codes, sell older dates first.', '• Use logs of Stonehorse to pour on draft before switching to new half barrels. All logs are right next to draft wall.'],
  'New Stock': ['• Midweight Hoodies (Amber & Slate blue)', '• DP T-shirts (Terracotta)'],
  'Upcoming Items': ['• Pickle Shirts'],
  'In House': ['• 4/18 Friday Bingo', '• 4/20 Easter Vinyl Sunday - need staff, Stephen away.'],
  'External': ['• 4/26 Saturday Spicy Pickle Beer Party at Lighthouse Keepers. Tickets on sale now. Posters in merch room have QR code.'],
  'Vendors': ['• 4/19 Cape Cod Macarons'],
  'Food Trucks': ['• 4/18 3-6pm RRBBQ', '• 4/25 3-6pm RRBBQ Ultimate Death Bingo (Last week)'],
  'Birthdays': ['• Stephen 4/18'],
  'Downtime Tasks': ['• Dust shelves in merch room, pick up clothes for deep clean.'],
  'Cleaning': ['• Go through checklists upon closing.', '• Wipe down draft menu and tables.', '• Check backroom trash: kitchen, office etc.'],
};

const Dashboard = () => {
  const [selectedSection, setSelectedSection] = useState('Beer Inventory');
  const [selectedSubsection, setSelectedSubsection] = useState('New Releases');

  const renderContent = () => {
    const items = content[selectedSubsection];
    if (!items) return <p className="text-gray-600">No data available.</p>;
    return <ul className="list-disc pl-5 space-y-1">{items.map((line, idx) => <li key={idx}>{line}</li>)}</ul>;
  };

  return (
    <div className="flex h-screen">
      {/* Section Nav */}
      <div className="w-1/5 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Sections</h2>
        {Object.keys(sections).map(section => (
          <div
            key={section}
            className={`cursor-pointer p-2 rounded hover:bg-gray-200 ${section === selectedSection ? 'bg-gray-300' : ''}`}
            onClick={() => {
              setSelectedSection(section);
              setSelectedSubsection(sections[section][0] || '');
            }}
          >
            {section}
          </div>
        ))}
      </div>

      {/* Subsection Nav */}
      <div className="w-1/5 bg-gray-50 p-4 border-l border-gray-200 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Subsections</h2>
        {sections[selectedSection].length > 0 ? (
          sections[selectedSection].map(sub => (
            <div
              key={sub}
              className={`cursor-pointer p-2 rounded hover:bg-gray-200 ${sub === selectedSubsection ? 'bg-gray-300' : ''}`}
              onClick={() => setSelectedSubsection(sub)}
            >
              {sub}
            </div>
          ))
        ) : (
          <p className="text-gray-600">No subsections</p>
        )}
      </div>

      {/* Content Display */}
      <div className="w-3/5 p-6 overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">{selectedSubsection || selectedSection}</h2>
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
