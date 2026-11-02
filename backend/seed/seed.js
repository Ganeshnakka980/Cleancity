const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const Feedback = require('../models/Feedback');
const Reward = require('../models/Reward');
const AuditLog = require('../models/AuditLog');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const createPlaceholder = (filename, label, color = '#10B981') => {
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="${color}"/>
      <circle cx="300" cy="180" r="60" fill="#ffffff" opacity="0.2"/>
      <text x="300" y="190" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${label}</text>
      <text x="300" y="230" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" opacity="0.8" text-anchor="middle">CleanCity Platform Photo</text>
    </svg>`;
    fs.writeFileSync(filePath, svgContent);
  }
  return `/uploads/${filename}`;
};

const sampleWasteImage = createPlaceholder('seed-waste-1.svg', 'GARBAGE REPORTED', '#EF4444');
const sampleWasteImage2 = createPlaceholder('seed-waste-2.svg', 'PLASTIC ACCUMULATION', '#F59E0B');
const sampleWasteImage3 = createPlaceholder('seed-waste-3.svg', 'OVERFLOWING BIN', '#8B5CF6');
const sampleWasteImage4 = createPlaceholder('seed-waste-4.svg', 'CONSTRUCTION DEBRIS', '#6B7280');
const sampleCleanProof = createPlaceholder('seed-clean-proof.svg', 'AREA CLEANED & RESTORED', '#10B981');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB Atlas using project db.js configuration...');
    await connectDB();
    console.log('[Seed] Database connected successfully.');

    console.log('[Seed] Clearing existing demo data...');
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await Notification.deleteMany({});
    await Feedback.deleteMany({});
    await Reward.deleteMany({});
    await AuditLog.deleteMany({});

    // Plain passwords - User.js pre('save') middleware will perform the ONLY password hashing
    const adminPassword = 'Admin@123';
    const staffPassword = 'Staff@123';
    const citizenPassword = 'Citizen@123';

    // Create Users
    console.log('[Seed] Creating demo users...');
    const admin = await User.create({
      name: 'Municipal Admin',
      email: 'admin@cleancity.com',
      password: adminPassword,
      phone: '+91 9820011223',
      role: 'admin',
      points: 500,
      isActive: true
    });

    const staff1 = await User.create({
      name: 'Rajesh Kumar (Ward 4 Staff)',
      email: 'staff@cleancity.com',
      password: staffPassword,
      phone: '+91 9876543210',
      role: 'staff',
      points: 250,
      isActive: true
    });

    const staff2 = await User.create({
      name: 'Suresh Patil (Ward 7 Staff)',
      email: 'staff2@cleancity.com',
      password: staffPassword,
      phone: '+91 9876543211',
      role: 'staff',
      points: 180,
      isActive: true
    });

    const citizen1 = await User.create({
      name: 'Aarav Sharma',
      email: 'citizen@cleancity.com',
      password: citizenPassword,
      phone: '+91 9123456789',
      role: 'citizen',
      points: 120,
      isActive: true
    });

    const citizen2 = await User.create({
      name: 'Priya Verma',
      email: 'citizen2@cleancity.com',
      password: citizenPassword,
      phone: '+91 9123456790',
      role: 'citizen',
      points: 85,
      isActive: true
    });

    console.log('✔ Users created (Admin, 2 Staff, 2 Citizens)');

    // Create Rewards & History
    await Reward.create({
      userId: citizen1._id,
      points: 120,
      level: 'Silver',
      history: [
        { points: 10, reason: 'Welcome bonus', referenceType: 'system', rewardType: 'welcome_bonus', createdAt: new Date(Date.now() - 30 * 86400000) },
        { points: 10, reason: 'Reported waste issue CC-2026-00001', referenceType: 'complaint', rewardType: 'report_created', createdAt: new Date(Date.now() - 25 * 86400000) },
        { points: 20, reason: 'Verified waste report CC-2026-00001', referenceType: 'complaint', rewardType: 'report_verified', createdAt: new Date(Date.now() - 20 * 86400000) },
        { points: 5, reason: 'Submitted feedback for CC-2026-00001', referenceType: 'feedback', rewardType: 'feedback_submitted', createdAt: new Date(Date.now() - 19 * 86400000) },
        { points: 75, reason: 'Civic Environmental Champion Award', referenceType: 'system', rewardType: 'custom', createdAt: new Date(Date.now() - 2 * 86400000) }
      ]
    });

    await Reward.create({
      userId: citizen2._id,
      points: 85,
      level: 'Bronze',
      history: [
        { points: 10, reason: 'Welcome bonus', referenceType: 'system', rewardType: 'welcome_bonus', createdAt: new Date(Date.now() - 20 * 86400000) },
        { points: 10, reason: 'Reported waste issue CC-2026-00002', referenceType: 'complaint', rewardType: 'report_created', createdAt: new Date(Date.now() - 15 * 86400000) },
        { points: 20, reason: 'Verified waste report CC-2026-00002', referenceType: 'complaint', rewardType: 'report_verified', createdAt: new Date(Date.now() - 12 * 86400000) },
        { points: 45, reason: 'Active Civic Reporter Badge', referenceType: 'system', rewardType: 'custom', createdAt: new Date(Date.now() - 5 * 86400000) }
      ]
    });

    console.log('✔ Rewards seeded');

    // Generate 25+ Realistic Complaints
    console.log('[Seed] Generating realistic Mumbai/Thane complaints dataset...');

    const locations = [
      { name: 'Dadar Station West, Mumbai', lat: 19.0178, lng: 72.8478 },
      { name: 'Bandra Reclamation, Mumbai', lat: 19.0596, lng: 72.8295 },
      { name: 'Thane West Station Road', lat: 19.2183, lng: 72.9781 },
      { name: 'Kalyan East Market Yard', lat: 19.2403, lng: 73.1305 },
      { name: 'Kurla West LBS Marg', lat: 19.0657, lng: 72.8797 },
      { name: 'Powai Lake Promenade, Mumbai', lat: 19.1176, lng: 72.9060 },
      { name: 'Andheri East SV Road', lat: 19.1197, lng: 72.8464 },
      { name: 'Ghatkopar East MG Road', lat: 19.0860, lng: 72.9080 },
      { name: 'Mulund West Check Naka', lat: 19.1726, lng: 72.9565 },
      { name: 'Dombivli East Station Road', lat: 19.2184, lng: 73.0867 }
    ];

    const categories = [
      'General Garbage',
      'Plastic Waste',
      'Overflowing Bin',
      'Illegal Dumping',
      'Construction Waste',
      'E-Waste',
      'Organic Waste',
      'Other'
    ];

    const statuses = ['pending', 'assigned', 'in_progress', 'resolved', 'verified'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const imagesList = [sampleWasteImage, sampleWasteImage2, sampleWasteImage3, sampleWasteImage4];

    const complaintsToCreate = [];

    // Hotspot Cluster 1 (Kalyan East)
    for (let i = 1; i <= 6; i++) {
      const latOffset = (Math.random() - 0.5) * 0.003;
      const lngOffset = (Math.random() - 0.5) * 0.003;
      const createdAt = new Date(Date.now() - (30 - i * 3) * 86400000);
      complaintsToCreate.push({
        complaintId: `CC-2026-000${String(i).padStart(2, '0')}`,
        userId: i % 2 === 0 ? citizen1._id : citizen2._id,
        image: imagesList[i % imagesList.length],
        category: i % 2 === 0 ? 'Overflowing Bin' : 'General Garbage',
        description: `Severe waste accumulation near Kalyan East Vegetable Market Block ${i}. Causes odor and blocks walkway.`,
        location: {
          type: 'Point',
          coordinates: [73.1305 + lngOffset, 19.2403 + latOffset] // GeoJSON [lng, lat]
        },
        address: `Kalyan East Market Yard, Block ${i}, Thane District`,
        priority: i > 3 ? 'critical' : 'high',
        status: i <= 2 ? 'verified' : i === 3 ? 'resolved' : i === 4 ? 'in_progress' : i === 5 ? 'assigned' : 'pending',
        assignedTo: i <= 5 ? staff1._id : null,
        resolutionImage: i <= 3 ? sampleCleanProof : '',
        resolutionNote: i <= 3 ? 'Entire market yard swept, sanitized, and waste trucked to recycling center.' : '',
        resolvedAt: i <= 3 ? new Date(createdAt.getTime() + 86400000 * 2) : null,
        createdAt,
        statusHistory: [
          { status: 'pending', changedBy: citizen1._id, note: 'Reported by citizen', changedAt: createdAt },
          ...(i <= 5
            ? [
                {
                  status: 'assigned',
                  changedBy: admin._id,
                  note: 'Assigned to Rajesh Kumar',
                  changedAt: new Date(createdAt.getTime() + 3600000 * 4)
                }
              ]
            : []),
          ...(i <= 4
            ? [
                {
                  status: 'in_progress',
                  changedBy: staff1._id,
                  note: 'Staff started cleaning operations',
                  changedAt: new Date(createdAt.getTime() + 3600000 * 8)
                }
              ]
            : []),
          ...(i <= 3
            ? [
                {
                  status: 'resolved',
                  changedBy: staff1._id,
                  note: 'Proof of cleaning uploaded & marked resolved',
                  changedAt: new Date(createdAt.getTime() + 86400000 * 2)
                }
              ]
            : []),
          ...(i <= 2
            ? [
                {
                  status: 'verified',
                  changedBy: citizen1._id,
                  note: 'Verified by citizen reporter',
                  changedAt: new Date(createdAt.getTime() + 86400000 * 2.5)
                }
              ]
            : [])
        ]
      });
    }

    // Hotspot Cluster 2 (Dadar Station)
    for (let i = 7; i <= 12; i++) {
      const latOffset = (Math.random() - 0.5) * 0.002;
      const lngOffset = (Math.random() - 0.5) * 0.002;
      const createdAt = new Date(Date.now() - (28 - i * 2) * 86400000);
      complaintsToCreate.push({
        complaintId: `CC-2026-000${String(i).padStart(2, '0')}`,
        userId: i % 2 === 0 ? citizen2._id : citizen1._id,
        image: imagesList[(i + 1) % imagesList.length],
        category: 'Plastic Waste',
        description: `Discarded single-use plastics and packaging littering Dadar West flower market area ${i}.`,
        location: {
          type: 'Point',
          coordinates: [72.8478 + lngOffset, 19.0178 + latOffset]
        },
        address: `Dadar Station West Flower Market Lane ${i}, Mumbai`,
        priority: 'high',
        status: i <= 9 ? 'verified' : i === 10 ? 'in_progress' : 'pending',
        assignedTo: i <= 10 ? staff2._id : null,
        resolutionImage: i <= 9 ? sampleCleanProof : '',
        resolutionNote: i <= 9 ? 'Plastic waste segregated and transferred to municipal recycler.' : '',
        resolvedAt: i <= 9 ? new Date(createdAt.getTime() + 86400000 * 1.5) : null,
        createdAt,
        statusHistory: [
          { status: 'pending', changedBy: citizen2._id, note: 'Reported by citizen', changedAt: createdAt }
        ]
      });
    }

    // Additional 14 complaints
    for (let i = 13; i <= 26; i++) {
      const loc = locations[i % locations.length];
      const category = categories[i % categories.length];
      const priority = priorities[i % priorities.length];
      const status = statuses[i % statuses.length];
      const createdAt = new Date(Date.now() - (26 - i) * 86400000 * 1.2);

      complaintsToCreate.push({
        complaintId: `CC-2026-000${String(i).padStart(2, '0')}`,
        userId: i % 2 === 0 ? citizen1._id : citizen2._id,
        image: imagesList[i % imagesList.length],
        category,
        description: `Unattended ${category.toLowerCase()} dumped near ${loc.name}. Urgent cleanup requested.`,
        location: {
          type: 'Point',
          coordinates: [loc.lng + (Math.random() - 0.5) * 0.005, loc.lat + (Math.random() - 0.5) * 0.005]
        },
        address: `${loc.name}, Sector ${i}`,
        priority,
        status,
        assignedTo: status !== 'pending' ? (i % 2 === 0 ? staff1._id : staff2._id) : null,
        resolutionImage: ['resolved', 'verified'].includes(status) ? sampleCleanProof : '',
        resolutionNote: ['resolved', 'verified'].includes(status) ? 'Cleanup crew dispatched, area completely cleared.' : '',
        resolvedAt: ['resolved', 'verified'].includes(status) ? new Date(createdAt.getTime() + 86400000 * 2) : null,
        createdAt,
        statusHistory: [
          { status: 'pending', changedBy: citizen1._id, note: 'Reported via CleanCity App', changedAt: createdAt }
        ]
      });
    }

    const createdComplaints = await Complaint.create(complaintsToCreate);
    console.log(`✔ Created ${createdComplaints.length} realistic complaints in Mumbai & Thane`);

    // Create 2dsphere Index
    await Complaint.collection.createIndex({ location: '2dsphere' });
    console.log('✔ 2dsphere geospatial index created on Complaint.location');

    // Create Feedback for Verified/Resolved Complaints
    console.log('[Seed] Creating citizen feedback entries...');
    const resolvedComplaints = createdComplaints.filter((c) => ['resolved', 'verified'].includes(c.status));

    if (resolvedComplaints.length > 0) {
      await Feedback.create({
        complaintId: resolvedComplaints[0]._id,
        userId: citizen1._id,
        rating: 5,
        comment: 'Extremely fast response! Staff arrived within 24 hours and thoroughly cleaned the spot.'
      });

      if (resolvedComplaints.length > 1) {
        await Feedback.create({
          complaintId: resolvedComplaints[1]._id,
          userId: citizen2._id,
          rating: 4,
          comment: 'Good work by the municipal crew. Area restored cleanly.'
        });
      }
    }
    console.log('✔ Feedback seeded');

    // Create Notifications
    console.log('[Seed] Creating in-app notifications...');
    await Notification.create([
      {
        userId: citizen1._id,
        title: 'Complaint Resolved! 🎉',
        message: 'Your complaint CC-2026-00001 at Kalyan East Market Yard has been resolved by staff.',
        type: 'success',
        isRead: true
      },
      {
        userId: citizen1._id,
        title: 'EcoPoints Earned! 🌟',
        message: 'You earned +20 EcoPoints for verified waste cleanup!',
        type: 'info',
        isRead: false
      },
      {
        userId: staff1._id,
        title: 'New Complaint Assigned 🚨',
        message: 'You have been assigned complaint CC-2026-00003 at Kalyan East Market Yard.',
        type: 'warning',
        isRead: false
      }
    ]);
    console.log('✔ Notifications seeded');

    console.log('\n==================================================');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('==================================================');
    console.log('Demo Credentials for CleanCity Platform:');
    console.log('--------------------------------------------------');
    console.log('ADMIN   : admin@cleancity.com   / Admin@123');
    console.log('STAFF   : staff@cleancity.com   / Staff@123');
    console.log('CITIZEN : citizen@cleancity.com / Citizen@123');
    console.log('==================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedData();
