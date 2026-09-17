import React, { useMemo, useState } from "react";

type Page = "lookup" | "radio" | "date" | "favorites" | "info";
type Level = "I" | "M" | "F" | "TOW" | "U" | "I/M" | "I/J";

type Citation = {
  category: string;
  section: string;
  code: string;
  level: Level;
  title: string;
};

type RadioCode = {
  group: "10-Codes" | "11-Codes" | "SDPD Codes" | "Disposition" | "Sheriff Terms" | "Stations" | "Scanner Statutes";
  code: string;
  meaning: string;
};

const RADIO_CODES: RadioCode[] = [
  ["10-Codes","10-1","Receiving poorly"],["10-Codes","10-2","Receiving well"],["10-Codes","10-3","Change channel"],
  ["10-Codes","10-4","Acknowledge message"],["10-Codes","10-5","Relay message"],["10-Codes","10-6","Busy"],
  ["10-Codes","10-7","Out of service"],["10-Codes","10-8","In service"],["10-Codes","10-9","Repeat"],
  ["10-Codes","10-10","Remain in service"],["10-Codes","10-16","Prisoner"],["10-Codes","10-17","Report routine"],
  ["10-Codes","10-19","Return to station"],["10-Codes","10-20","Location"],["10-Codes","10-21","Phone station"],
  ["10-Codes","10-21H","Phone home"],["10-Codes","10-22","Disregard"],["10-Codes","10-23","Stand by"],
  ["10-Codes","10-28","Vehicle registration check"],["10-Codes","10-29","Check for wants / warrants"],
  ["10-Codes","10-34","Are you clear?"],["10-Codes","10-35","Dangerous / armed person alert"],
  ["10-Codes","10-36","Time check"],["10-Codes","10-41","Beginning of shift"],["10-Codes","10-42","End of shift"],
  ["10-Codes","10-46","Assist motorist"],["10-Codes","10-53","Road blocked"],["10-Codes","10-60","Attempt to contact"],
  ["10-Codes","10-87","Meet the officer"],["10-Codes","10-88","Request cover unit"],["10-Codes","10-89","Bomb threat"],
  ["10-Codes","10-92","Radio check"],["10-Codes","10-97","Arrived at scene"],["10-Codes","10-98","Finished last assignment"],

  ["11-Codes","11-6","Discharging firearm"],["11-Codes","11-7","Prowler"],["11-Codes","11-8","Person down"],
  ["11-Codes","11-10","Take a report / conduct an investigation"],["11-Codes","11-12","Injured animal"],
  ["11-Codes","11-13","Dead animal"],["11-Codes","11-14","Dog bite"],["11-Codes","11-15","Ball game in street"],
  ["11-Codes","11-24","Abandoned vehicle"],["11-Codes","11-27","Felony record, no want"],
  ["11-Codes","11-28","Misdemeanor record, no want"],["11-Codes","11-29","No want"],
  ["11-Codes","11-30","Incomplete phone call"],["11-Codes","11-31","Calling for help"],
  ["11-Codes","11-40","Notify if ambulance needed"],["11-Codes","11-41","Ambulance needed"],
  ["11-Codes","11-42","Ambulance not needed"],["11-Codes","11-44","Coroner's case"],
  ["11-Codes","11-45","Suicide"],["11-Codes","11-46","Death"],["11-Codes","11-47","Injured person"],
  ["11-Codes","11-48","Provide transportation"],["11-Codes","11-49","Vehicle stop"],
  ["11-Codes","11-50","Vehicle stop, license check"],["11-Codes","11-51","Pedestrian stop / field investigation"],
  ["11-Codes","11-52","Status check"],["11-Codes","11-53","Security check"],
  ["11-Codes","11-55","Hazardous / chemical spill"],["11-Codes","11-60","Water leak"],
  ["11-Codes","11-66","Traffic lights out"],["11-Codes","11-71","Fire"],
  ["11-Codes","11-80","Accident, serious injury"],["11-Codes","11-81","Accident, minor injury"],
  ["11-Codes","11-82","Accident, property damage / no injury"],["11-Codes","11-83","Accident, no details"],
  ["11-Codes","11-84","Traffic control"],["11-Codes","11-85","Tow truck"],
  ["11-Codes","11-86","Special detail"],["11-Codes","11-88","Citizen assist"],["11-Codes","11-99","Officer needs help"],

  ["SDPD Codes","Code 3","Expedite cover"],["SDPD Codes","Code 4","No further help needed"],
  ["SDPD Codes","Code 5","Stakeout"],["SDPD Codes","Code 6","Remain clear of area (marked units)"],
  ["SDPD Codes","Code 7","Lunch"],["SDPD Codes","Code 8","Restroom break"],
  ["SDPD Codes","Code 10","SWAT alert"],["SDPD Codes","Code 11","SWAT staging location"],

  ["Disposition","A","Arrest made"],["Disposition","K","No report required"],
  ["Disposition","R","Report made"],["Disposition","U","Unfounded"],

  ["Sheriff Terms","37F","Felony want"],["Sheriff Terms","37M","Misdemeanor want"],
  ["Sheriff Terms","37T","Traffic want"],["Sheriff Terms","Code Blue","Bus or taxi in trouble"],
  ["Sheriff Terms","CNA","Contacted and advised"],["Sheriff Terms","ONS","Officer Notification System"],
  ["Sheriff Terms","Clear MO","Clear of warrants with Marshal's Office"],

  ["Stations","Station A","San Diego Police"],["Stations","Station B","San Diego Lifeguard"],
  ["Stations","Station C","Chula Vista Police / Carlsbad Police"],["Stations","Station D","San Diego Community College Police / Coronado Police"],
  ["Stations","Station F","San Diego Fire"],["Stations","Station G","San Diego District Attorney's Office"],
  ["Stations","Station H","Escondido Police"],["Stations","Station K","El Cajon Police / San Diego City School Police"],
  ["Stations","Station L","San Diego Sheriff Court Services"],

  ["Scanner Statutes","PC 148","Resisting arrest"],["Scanner Statutes","PC 187","Homicide"],
  ["Scanner Statutes","PC 192","Manslaughter"],["Scanner Statutes","PC 206","Torture"],
  ["Scanner Statutes","PC 207","Kidnapping"],["Scanner Statutes","PC 211","Robbery"],
  ["Scanner Statutes","PC 215","Carjacking"],["Scanner Statutes","PC 240","Assault"],
  ["Scanner Statutes","PC 242","Battery"],["Scanner Statutes","PC 245","Assault with a deadly weapon"],
  ["Scanner Statutes","PC 246","Shooting at a dwelling"],["Scanner Statutes","PC 273.5","Domestic violence with injury"],
  ["Scanner Statutes","PC 288","Sex crimes against a minor"],["Scanner Statutes","PC 314","Indecent exposure"],
  ["Scanner Statutes","PC 374","Dumping"],["Scanner Statutes","PC 415","Disturbing the peace"],
  ["Scanner Statutes","PC 417","Displaying a weapon"],["Scanner Statutes","PC 422","Criminal threats"],
  ["Scanner Statutes","PC 451","Arson"],["Scanner Statutes","PC 459","Burglary"],
  ["Scanner Statutes","PC 470","Forgery"],["Scanner Statutes","PC 487","Grand theft"],
  ["Scanner Statutes","PC 488","Petty theft"],["Scanner Statutes","PC 496","Possession of stolen property"],
  ["Scanner Statutes","PC 594","Vandalism"],["Scanner Statutes","PC 597","Animal abuse"],
  ["Scanner Statutes","PC 602","Trespassing"],["Scanner Statutes","PC 647","Disorderly conduct"],
  ["Scanner Statutes","CVC 4000(a)","Unregistered vehicle"],["Scanner Statutes","CVC 10851","Stolen vehicle"],
  ["Scanner Statutes","CVC 12500","Driving without a license"],["Scanner Statutes","CVC 14601","Driving with suspended license"],
  ["Scanner Statutes","CVC 20001","Hit and run involving injury"],["Scanner Statutes","CVC 20002","Hit and run, property damage"],
  ["Scanner Statutes","CVC 21650","Wrong side of road"],["Scanner Statutes","CVC 22350","Unsafe speed for conditions"],
  ["Scanner Statutes","CVC 22450","Failure to stop at stop sign"],["Scanner Statutes","CVC 22500","Illegal parking"],
  ["Scanner Statutes","CVC 23103","Reckless driving"],["Scanner Statutes","CVC 23152","Driving under the influence"],
  ["Scanner Statutes","H&S 11350","Possession of a controlled narcotic"],["Scanner Statutes","H&S 11377","Possession of a controlled substance"],
  ["Scanner Statutes","W&I 5150","Danger to self or others (mental health hold reference)"]
].map(([group, code, meaning]) => ({ group: group as RadioCode["group"], code, meaning }));

const RADIO_GROUPS: Array<"All" | RadioCode["group"]> = [
  "All", "10-Codes", "11-Codes", "SDPD Codes", "Disposition", "Sheriff Terms", "Stations", "Scanner Statutes"
];

type AppearanceResult = {
  issued: Date;
  raw: Date;
  adjusted: Date;
  notes: string[];
  issuedDuringCourtHours: boolean;
};

const DATA = `General Provisions / Admin|31|CVC|M|False Information
General Provisions / Admin|2800(a)|CVC|M|Fail to obey Lawful Order
General Provisions / Admin|2800.1(a)|CVC|M|Evading Peace Officer (marked veh)
General Provisions / Admin|2800.1(b)|CVC|M|Evading Peace Officer (marked bicycle)
General Provisions / Admin|2800.2|CVC|F|Evade: Reckless Driving
General Provisions / Admin|2818|CVC|I|Flare or Cone Pattern: Traverse
Registration Of Vehicles|4000(a)(1)|CVC|I|Unregistered Vehicle
Registration Of Vehicles|4159|CVC|I|Notify DMV Address Change (10 days)
Registration Of Vehicles|4160|CVC|I|Address Change on Registration in ink (10 days)
Registration Of Vehicles|4454(a)|CVC|I|Registration: not in veh (CA registered)
Registration Of Vehicles|4462(a)|CVC|I|Registration: not in veh (out of state)
Registration Of Vehicles|4462(b)|CVC|I|Display/Present/Use Wrong reg/tab/plate
Registration Of Vehicles|4462.5|CVC|M|Above: w/intent to avoid Registration Fees
Registration Of Vehicles|4463(a)(1)|CVC|F|Counterfeit Reg/tab/plate
Registration Of Vehicles|4464|CVC|I|Altered License Plate
Registration Of Vehicles|5200|CVC|I|License Plates: 2 attached front/rear
Registration Of Vehicles|5201|CVC|I|License Plates: Securely Mounted: rear 12-16 in, front under 60 in
Registration Of Vehicles|5201(f)|CVC|I|License Plates: Covered
Registration Of Vehicles|5201(g)|CVC|I|License Plates: Obscured
Registration Of Vehicles|5204|CVC|I|Expired Registration Tabs
Drivers License|12500(a)|CVC|M|Unlicensed Driver
Drivers License|12500(b)|CVC|I|Motorcycle: M1 or M2 License Required
Drivers License|12511|CVC|I|No more than one DL
Drivers License|12509.5(c)|CVC|I|Motorcycle Instruction Permit Restrictions
Drivers License|12814.6(a)(1)|CVC|I|Failure to obey instructional permit restrictions
Drivers License|12814.6(b)(1)|CVC|I|Failure to obey Provisional License restrictions
Drivers License|12815(a)|CVC|I|DL Mutilated
Drivers License|12951(a)|CVC|I|DL not in possession
Drivers License|12951(b)|CVC|M|Refuse to Present DL
Drivers License|14600(a)|CVC|I|Change of Address
Drivers License|14601(a)|CVC|M|Suspended or Revoked: Reckless
Drivers License|14601.1(a)|CVC|M|Suspended or Revoked: Not Driving Related
Drivers License|14601.2(a)|CVC|M|Suspended or Revoked: DUI
Drivers License|14603|CVC|I|Disobey License Restrictions
Drivers License|14610(a)(3)|CVC|M|Display Another Person's Driver License
Drivers License|14610(a)(8)|CVC|M|Alter Driver License
Financial Responsibility Laws|16028(a)|CVC|I|Proof of Insurance
Bicycle Operation|21201(d)(1)|CVC|I|Bike Light Visible 300 feet
Bicycle Operation|21203|CVC|I|Hitching a Ride
Bicycle Operation|21212|CVC|I|Bicycle Helmet under 18
Bicycle Operation|21650.1|CVC|I|Riding against traffic
Bicycle Operation|21210|CVC|I|Bike blocking sidewalk
Bicycle Operation|21205|CVC|I|At least one hand on handlebars
Bicycle Operation|21201(a)|CVC|I|Brake Required
Bicycle Operation|21204(a)|CVC|I|Rider must ride on permanent attached seat
Bicycle Operation|21204(b)|CVC|I|Passenger on bicycle other than seat
Signals & Markings|21453(a)|CVC|I|Red Light
Signals & Markings|21453(b)|CVC|I|Yield Before Right Turn on Red
Signals & Markings|21453(c)|CVC|I|Red Arrow Signal
Signals & Markings|22450|CVC|I|Stop Sign
Signals & Markings|21453(d)|CVC|I|Pedestrian Cross Against Red
Signals & Markings|21457(a)|CVC|I|Flashing Red Signal
Signals & Markings|21460(a)|CVC|I|Double Solid Lines
Signals & Markings|21461(a)|CVC|I|Disobeying Signs
Driving, Overtaking & Passing|21650|CVC|I|Driving: Wrong Side of Roadway
Driving, Overtaking & Passing|21651(a)(1)|CVC|I|Divided Highway Island On, Over, or Across
Driving, Overtaking & Passing|21651(a)(2)|CVC|I|Divided Highway Turn Across
Driving, Overtaking & Passing|21651(b)|CVC|M|Wrong Way on Divided Highway
Driving, Overtaking & Passing|21655.5|CVC|I|Carpool Lanes
Driving, Overtaking & Passing|21657|CVC|I|Wrong Way
Driving, Overtaking & Passing|21658(a)|CVC|I|Unsafe Lane Change or Straddling
Driving, Overtaking & Passing|21663|CVC|I|Driving on Sidewalk
Driving, Overtaking & Passing|21703|CVC|I|Following Too Closely
Driving, Overtaking & Passing|21706|CVC|I|Follow Emergency Vehicle Within 300 Feet
Driving, Overtaking & Passing|21708|CVC|I|Drive Over Fire Hose
Driving, Overtaking & Passing|21755(a)|CVC|I|Passing on Right When Unlawful
Right Of Way|21800(a)|CVC|I|Uncontrolled Intersection
Right Of Way|21800(c)|CVC|I|4 Way Stop
Right Of Way|21802(a)|CVC|I|Enter from a Stop Sign
Right Of Way|21803(a)|CVC|I|Yield Sign
Right Of Way|21804(a)|CVC|I|Enter or Cross a Highway
Right Of Way|21806(a)(1)|CVC|I|Yield to Code-3 Emergency Vehicle
Right Of Way|21950(a)|CVC|I|Pedestrian in Crosswalk: Driver Yield
Turning, Starting & Signaling|22100(a)|CVC|I|Right Turn from Right Side
Turning, Starting & Signaling|22100(b)|CVC|I|Left Turn from Left Side
Turning, Starting & Signaling|22100.1|CVC|I|U-Turn from Far Left Lane
Turning, Starting & Signaling|22101(d)|CVC|I|Turns Required or Prohibited by Sign
Turning, Starting & Signaling|22102|CVC|I|U Turn Business District
Turning, Starting & Signaling|22103|CVC|I|U Turn Residence District
Turning, Starting & Signaling|22104|CVC|I|U Turn Fire Station
Turning, Starting & Signaling|22106|CVC|I|Unsafe Backing or Starting
Turning, Starting & Signaling|22107|CVC|I|Unsafe Turn or Failure to Signal
Turning, Starting & Signaling|22108|CVC|I|Turn Signal Required 100 Feet Before Turn
Speed Laws|22348(b)|CVC|I|Excessive Speed Over 100 MPH
Speed Laws|22349(a)|CVC|I|Max Speed 65 MPH
Speed Laws|22350|CVC|I|Unsafe Speed
Speed Laws|22400(a)|CVC|I|Minimum Speed or Impede Traffic
Speed Laws|22405(a)|CVC|I|Speed on Bridge
Speed Laws|22411|CVC|I|Scooter 15 MPH Max
Speed Laws|22526(a)|CVC|I|Gridlock Driving Straight
Speed Laws|22526(b)|CVC|I|Gridlock Turning Without Room
Public Offenses|23103(a)|CVC|M|Reckless Driving Highway
Public Offenses|23103(b)|CVC|M|Reckless Driving Parking Lot
Public Offenses|23109(a)|CVC|M|Speed Contest
Public Offenses|23109(b)|CVC|M|Aid or Abet Speed Contest
Public Offenses|23109(c)|CVC|M|Exhibition of Speed
Public Offenses|23110(a)|CVC|M|Throw Substance at Vehicle
Public Offenses|23110(b)|CVC|F|Throw Substance at Vehicle with Intent to Cause GBI
Public Offenses|23116(a) or (b)|CVC|I|Passenger in Bed of Pick Up
Public Offenses|23111|CVC|I|Throw Cigarette or Burning Item
Public Offenses|23112(a)|CVC|I|Litter on Highway
Public Offenses|23117(a)|CVC|I|Untethered Animal in Truck Bed
Scooters|21223(a)(1)|CVC|I|Front Light Required
Scooters|21228(a)|CVC|I|Too Slow or Not Riding on Right
Scooters|21229(a)|CVC|I|Required to Ride in Marked Bike Lane
Scooters|21229(b)|CVC|I|Unsafe Lane Change or Fail to Signal
Scooters|21235(b)|CVC|I|Helmet Required
Scooters|21235(d)|CVC|I|Operate Under 16 Years Old
Scooters|21235(g)|CVC|I|Ride on Sidewalk
Alcohol/Tobacco Violations|21200.5|CVC|M|DUI on a Bike
Alcohol/Tobacco Violations|21221.5|CVC|M|DUI Scooter BAC .08 or Greater
Alcohol/Tobacco Violations|23136(a)|CVC|I|Under 21 BAC .01 or Greater
Alcohol/Tobacco Violations|23140|CVC|I|DUI Under 21 BAC .05 or Greater
Alcohol/Tobacco Violations|23152(a)|CVC|M|DUI Driving Under the Influence
Alcohol/Tobacco Violations|23152(b)|CVC|M|DUI BAC .08 or Greater
Alcohol/Tobacco Violations|23153|CVC|F|DUI with Injury
Alcohol/Tobacco Violations|23154(a)|CVC|M|DUI Probationer BAC .01 or Greater
Alcohol/Tobacco Violations|23220|CVC|I|Drive While Drinking
Alcohol/Tobacco Violations|23221|CVC|I|Drinking in Vehicle Upon Highway
Alcohol/Tobacco Violations|23222(a)|CVC|I|Open Container Driver While Driving
Alcohol/Tobacco Violations|23223(a)|CVC|I|Open Container Driver Parked
Alcohol/Tobacco Violations|23223(b)|CVC|I|Open Container Passenger
Alcohol/Tobacco Violations|23222(b)|CVC|M|Marijuana in Vehicle Less Than 28.5g
Alcohol/Tobacco Violations|23224(a)|CVC|I|Driver Under 21 Transport Alcohol
Alcohol/Tobacco Violations|23224(b)|CVC|I|Passenger Under 21 Possess Alcohol
Alcohol/Tobacco Violations|308(b)|PC|I|Minor 16-18 Possess Tobacco
Cell Phone/Texting/GPS/Sunglasses|23123(a)|CVC|I|Cell Phone Use While Driving
Cell Phone/Texting/GPS/Sunglasses|23123.5(a)|CVC|I|Texting While Driving
Cell Phone/Texting/GPS/Sunglasses|23124(b)|CVC|I|Under 18 Use Cell Phone
Cell Phone/Texting/GPS/Sunglasses|26708(2)|CVC|I|View Obstructed by Object or Material
Cell Phone/Texting/GPS/Sunglasses|23120|CVC|I|Operate Vehicle with Wide Temple Glasses
Equipment Violations|24250|CVC|I|Drive Without Required Lights During Darkness
Equipment Violations|24252(a)|CVC|I|Lighting Devices in Good Working Order
Equipment Violations|24400|CVC|I|Headlamps Required
Equipment Violations|24403|CVC|I|Fog Lamps Not in Place of Headlamps
Equipment Violations|24405(a)|CVC|I|Forward Lamps Not to Exceed 4
Equipment Violations|24409(a)|CVC|I|Failure to Dim High Beams Oncoming
Equipment Violations|24409(b)|CVC|I|Failure to Dim High Beams Following
Equipment Violations|24600|CVC|I|Tail Lamps Required
Equipment Violations|24601|CVC|I|License Plate Light Required
Equipment Violations|24603(b)|CVC|I|Stop Lamps Required
Equipment Violations|24606(c)|CVC|I|Backup Lamps Used Other Than Backing
Equipment Violations|24951(b)(1)|CVC|I|Turn Signals Required Front and Rear
Equipment Violations|25400(a)|CVC|I|Improper Lights to Front
Equipment Violations|25400(b)|CVC|I|Modified Lights or Equipment Color
Equipment Violations|26101(b)|CVC|I|Modify Lights or Equipment Color
Equipment Violations|26707|CVC|I|Windshield Wipers
Equipment Violations|26708(a)(1)|CVC|I|Window Obstructed
Equipment Violations|26708(b)|CVC|I|View Obstructed
Equipment Violations|26708.5|CVC|I|Window Tint
Equipment Violations|26709(a)|CVC|I|Rear View Mirror Required
Equipment Violations|26709(b)|CVC|I|Side View Mirrors Required
Equipment Violations|26710|CVC|I|Defective Windshield
Equipment Violations|27000|CVC|I|Horn Required
Equipment Violations|27007|CVC|I|Loud Stereo Greater Than 50 Feet
Equipment Violations|27150(a)|CVC|I|Muffler Defective or Excessive Noise
Equipment Violations|27155|CVC|I|Gas Cap Required
Equipment Violations|27315(d)|CVC|I|Seatbelt Required Driver
Equipment Violations|27315(e)|CVC|I|Seatbelt Required Passenger
Equipment Violations|27360(a)|CVC|I|Child Seat Parent
Equipment Violations|27360(b)|CVC|I|Child Seat Driver
Equipment Violations|27400|CVC|I|Headset or Earplugs Cover Both Ears
Equipment Violations|27465(b)|CVC|I|Bald Tires
Equipment Violations|27600|CVC|I|Fenders or Mudguards Required
Equipment Violations|28701|CVC|I|Bumpers Required
Equipment Violations|27803(b)|CVC|I|Motorcycle Helmet Required
Storage & Impound|22651(a)|CVC|TOW|Unattended on Bridge
Storage & Impound|22651(b)|CVC|TOW|Blocks Highway
Storage & Impound|22651(c)|CVC|TOW|Stolen or Embezzled
Storage & Impound|22651(d)|CVC|TOW|Blocking Driveway
Storage & Impound|22651(e)|CVC|TOW|Blocking Fire Hydrant
Storage & Impound|22651(h)(1)|CVC|TOW|Driver Arrested
Storage & Impound|22651(h)(2)|CVC|TOW|Alcohol Screen Test Driver Under 21
Storage & Impound|22651(i)(1)|CVC|TOW|5 or More Parking Violations
Storage & Impound|22651(k)|CVC|TOW|72 Hour Violation
Storage & Impound|22651(n)|CVC|TOW|Posted Signs
Storage & Impound|22651(o)(1)|CVC|TOW|Expired Registration 6 Months
Storage & Impound|22651(o)(2)|CVC|TOW|Expired Registration Off Street
Storage & Impound|22651(p)|CVC|TOW|12500 and 14601 Violations
Storage & Impound|22651.5(a)|CVC|TOW|Alarm or Horn 45 Minutes
Storage & Impound|22669(a)|CVC|TOW|Abandoned Vehicle
Storage & Impound|22669(b)|CVC|TOW|Vehicle Public Hazard
Storage & Impound|22655(a)|CVC|TOW|Involved in Hit and Run
Storage & Impound|22655.5|CVC|TOW|Impound for Investigation
Fireworks|12676|HSC|M|Fireworks Unlawful Sales
Fireworks|12677|HSC|M|Fireworks Possession
Fireworks|12680|HSC|M|Fireworks Unlawful Discharge
Fireworks|78.1028|UFC|M|Fireworks Possess, Use, Explode, Store, or Sell
Minor In Possession BPC|25661|BPC|I|Possess False ID by Minor
Minor In Possession BPC|25662(a)|BPC|M|Minor Possess Alcohol in Public
Minor In Possession BPC|25668(a)|BPC|M|Minor Sell or Furnish Alcohol to Under 21
Minor In Possession BPC|25668(b)|BPC|M|Minor Buy or Consume Alcohol
Minor In Possession BPC|25668(c)|BPC|M|Purchase or Furnish Alcohol to Minor
Minor In Possession BPC|25668(d)|BPC|M|Allow Minor to Consume Alcohol in Bar
Domestic Violence Laws PC|136.1|PC|F|DV Dissuading Witness or Victim
Domestic Violence Laws PC|236|PC|F|DV False Imprisonment
Domestic Violence Laws PC|243(e)(1)|PC|F|DV Battery
Domestic Violence Laws PC|273.5|PC|F|DV Injury to Spouse or Cohabitant
Domestic Violence Laws PC|591|PC|F|DV Injury to Phone Line
Domestic Violence Laws PC|646.9(a)|PC|F|DV Stalking
Domestic Violence Laws PC|646.9(b)|PC|F|DV Stalking with TRO
Domestic Violence Laws PC|13730|PC|F|DV Incident Report
Penal Code Sections PC|166(a)(4)|PC|M|Court Order Violation Criminal
Penal Code Sections PC|215(a)|PC|F|Carjacking
Penal Code Sections PC|245(a)(1)|PC|F|ADW or GBI Other Than Firearm
Penal Code Sections PC|245(a)(2)|PC|F|ADW Firearm
Penal Code Sections PC|273.6|PC|M|Court Order Civil DV or EPO
Penal Code Sections PC|243(a)|PC|M|Battery
Penal Code Sections PC|374.3(a)|PC|I|Urinating in Public or Waste Matter
Penal Code Sections PC|374.4|PC|I|Littering
Penal Code Sections PC|140|PC|F|Threatening Witness
Penal Code Sections PC|148(a)(1)|PC|M|Resist Delay Obstruct
Penal Code Sections PC|148.5|PC|M|False Police Report
Penal Code Sections PC|148.9(a)|PC|M|False Identity to Officer
Penal Code Sections PC|422|PC|M|Criminal Threats
Penal Code Sections PC|314|PC|U|Lewd or Obscene Acts
Penal Code Sections PC|370|PC|M|Public Nuisance
Penal Code Sections PC|451|PC|F|Arson
Penal Code Sections PC|466|PC|M|Burglary Tools
Penal Code Sections PC|470|PC|F|Forgery
Penal Code Sections PC|485|PC|F|Misappropriation of Found Property
Penal Code Sections PC|487|PC|F|Grand Theft Over 950
Penal Code Sections PC|488|PC|M|Petty Theft Under 950
Penal Code Sections PC|3056|PC|U|Parole Violation Hold
Weapons|21510|PC|M|Switchblade
Weapons|25400(a)|PC|M|Concealed Firearm
Weapons|25850(a)|PC|M|Loaded Firearm Open Carry
Weapons|Various|PC|F|Possession of Weapon
Drugs Cocaine Codeine Heroin Morphine Mescaline Methadone Percodan Peyote Quaalude|11350|HSC|F|Drugs Possession
Drugs Cocaine Codeine Heroin Morphine Mescaline Methadone Percodan Peyote Quaalude|11351|HSC|F|Drugs Possession for Sales
Drugs Cocaine Codeine Heroin Morphine Mescaline Methadone Percodan Peyote Quaalude|11352|HSC|F|Drugs Sell Furnish Give Transport
Drugs Cocaine Codeine Heroin Morphine Mescaline Methadone Percodan Peyote Quaalude|11368|HSC|F|Forged or Altered Prescription
Drugs Marijuana Pot Hash|11357(a)|HSC|F|Drugs Possession More Than 28.5g
Drugs Marijuana Pot Hash|11357(b)|HSC|F|Drugs Possession Less Than 28.5g
Drugs Marijuana Pot Hash|11359|HSC|F|Drugs Possession for Sales
Drugs Marijuana Pot Hash|11360(a)|HSC|F|Drugs Sell or Furnish
Drugs Marijuana Pot Hash|11361|HSC|F|Drugs Use of or Sales to Minor
Drugs Marijuana Pot Hash|11358|HSC|F|Drugs Cultivate Harvest Process
Drugs Methamphetamine Barbiturates Hallucinogens Steroids LSD PCP Ritalin|11377|HSC|U|Possession
Drugs Methamphetamine Barbiturates Hallucinogens Steroids LSD PCP Ritalin|11378|HSC|F|Drugs Possession for Sales
Drugs Methamphetamine Barbiturates Hallucinogens Steroids LSD PCP Ritalin|11379(a)|HSC|F|Drugs Sell Furnish Give Transport
Drugs Methamphetamine Barbiturates Hallucinogens Steroids LSD PCP Ritalin|11380|HSC|F|Drugs Use of or Sales to Minor
Drugs Other|11357|HSC|F|Under the Influence of Controlled Substance
Drugs Other|11391|HSC|F|Mushrooms Transport or Sell
Drugs Other|11364|HSC|M|Possession of Paraphernalia
Drugs Other|4140|BPC|M|Possess Hypodermic Needle
Drugs Other|4060|BPC|M|Possess Prescription Drug Without Prescription
Parking Violations CVC|5200|CVC|I|License Plates Missing Parked
Parking Violations CVC|5204|CVC|I|Expired Tags Parked
Parking Violations CVC|22500(a)|CVC|I|Parking in Intersection
Parking Violations CVC|22500(b)|CVC|I|Parking in Crosswalk
Parking Violations CVC|22500(c)|CVC|I|Parked Red Curb or Safety Zone
Parking Violations CVC|22500(d)|CVC|I|Parked Within 15 Feet of Fire Department Driveway
Parking Violations CVC|22500(e)(1)|CVC|I|Parked Blocking Driveway
Parking Violations CVC|22500(f)|CVC|I|Parking on or Across Sidewalk
Parking Violations CVC|22500(h)|CVC|I|Double Parking
Parking Violations CVC|22500(i)|CVC|I|Parking in Bus Loading Zone
Parking Violations CVC|22500.1|CVC|I|Stop Stand Park in Fire Lane
Parking Violations CVC|22502a|CVC|I|Parked Wrong Side or Over 18 Inches from Curb
Parking Violations CVC|22505b|CVC|I|Parked on Posted Highway
Parking Violations CVC|22514|CVC|I|Parked Within 15 Feet of Hydrant
Parking Violations CVC|22507.8a|CVC|I|Disabled Parking Space
Parking Violations CVC|22507.8c|CVC|I|Park on Disabled Space Crosshatch
Parking Violations CVC|22522|CVC|I|Parked Within 3 Feet of Access Ramp
Environmental|62.0606|SDMC|I|Attaching Rope, Wire, Etc. Detrimental Substance Prohibited
Environmental|43.0304|SDMC|M|Illegal Discharge into Storm Drain
Environmental|62.0604|SDMC|I|Removal of Planting Prohibited
Airspace|52.5403|SDMC|M|Drones Careless or Reckless / FAA Restriction / Emergency Interference
Airspace|63.0201(b)|SDMC|M|Soaring or Gliding Without Permit
Property Crime|498(b)(5)|PC|M|Utility Theft: City Electricity Without Permission
Property Crime|602(m)|PC|M|Trespass: Entering and Occupying Real Property or Structures
Property Crime|602(e)|PC|M|Trespass and Remove Earth, Soil, or Stone from Park
Property Crime|602(h)|PC|M|Trespass Fence or Gate by Opening or Destroying
Property Crime|602(j)|PC|M|Trespass Land and Injure Property of Owner
Property Crime|602(k)(3)|PC|M|Trespass Posted Land by Damaging or Unlocking Gate Lock
Property Crime|63.0106(a)|SDMC|I|Skating Prohibited Balboa Park
General Park Codes|63.0102(c)(1)|SDMC|I|Posting of Handbills Prohibited
General Park Codes|63.0102(c)(2)|SDMC|I|Loose Animal
General Park Codes|63.0102(c)(2)(B)|SDMC|I|Dog Leash Exceeds 8 Feet
General Park Codes|63.0102(e)(1)|SDMC|I|Dog License Required Over 4 Months
General Park Codes|63.0102(c)(3)|SDMC|I|Fireworks Prohibited
General Park Codes|63.0102(c)(4)|SDMC|I|Destruction of Plants
General Park Codes|63.0102(c)(5)|SDMC|I|Defacement of Property
General Park Codes|63.0102(c)(6)|SDMC|I|Dumping Prohibited
General Park Codes|63.0102(c)(7)|SDMC|I|Glass Containers Prohibited
General Park Codes|63.0102(c)(8)|SDMC|I|Littering Prohibited
General Park Codes|63.0102(c)(9)|SDMC|I|Park Waters
General Park Codes|63.0102(c)(10)|SDMC|I|Mistreating Animals
General Park Codes|63.0102(c)(11)|SDMC|I|Fires Prohibited
General Park Codes|63.0102(c)(12)|SDMC|I|Temporary Structures Prohibited
General Park Codes|63.0102(c)(13)|SDMC|I|Sales Prohibited
General Park Codes|63.0102(c)(14)|SDMC|I|Commercial Activity or Service Prohibited
General Park Codes|63.0102(c)(15)|SDMC|I|Shows Prohibited
General Park Codes|63.0102(c)(16)|SDMC|I|Indecent Conduct or Threat
General Park Codes|63.0102(c)(17)|SDMC|I|Sports in Designated Areas Only
General Park Codes|63.0102(c)(18)|SDMC|I|Disobey Lawful Order or False ID
General Park Codes|63.0102(c)(19)(1)|SDMC|I|Bicycles Prohibited
General Park Codes|63.0102(c)(19)(4)|SDMC|I|Motorized Vehicles Prohibited
General Park Codes|63.0102(c)(20)|SDMC|I|Speeding in Park
General Park Codes|63.0102(c)(21)|SDMC|I|Parking in Undesignated Area
General Park Codes|63.0102(c)(22)|SDMC|I|Car Washing Prohibited
General Park Codes|63.0102(c)(23)|SDMC|I|Oversized Vehicular Traffic
General Park Codes|63.0102(c)(24)|SDMC|I|Large Groups 50+ People
General Park Codes|63.0102(c)(24)|SDMC|I|Obstructing Traffic
General Park Codes|63.0102(c)(26)|SDMC|I|Move or Destroy Park Materials
General Park Codes|63.1012(c)(27)|SDMC|I|Bridle Trails Equestrian Only
General Park Codes|63.0102(c)(28)|SDMC|I|Unlawful Use of Valves or Utilities
Public Nuisance|63.20.5(j)|SDMC|I|Household Furniture in Public Coastal
Public Nuisance|56.55|SDMC|I/M|Urination or Defecation
Public Nuisance|22435.2(f)|BPC|M|Shopping Cart with Placard
Public Nuisance|54.0110|SDMC|I|Unauthorized Encroachment
Public Nuisance|66.0402|SDMC|I/M|Unauthorized Collection of Recyclables
Public Nuisance|64.0301(a)|SDMC|M|Discharge of Wastewater
Public Nuisance|63.20.5(b)|SDMC|I|Refuse Receptacle Rummage
Public Nuisance|66.0301|SDMC|I|Tampering with or Removal of Refuse
Vandalism|594(b)(2)(a)|PC|M|Vandalism Under $950
Vandalism|594(b)(1)|PC|F|Felony Vandalism $950 or More
Vandalism|63.07|SDMC|I/M|Torrey Pine Trees Destruction or Injury
Vandalism|622|PC|M|Injure, Disfigure, or Destroy Monument, Art, Shade Tree, or Ornamental Plant
Vandalism|622.5|PC|M|Injure, Deface, or Destroy Archaeological or Historical Object
Vandalism|594.2(a)|PC|M|Possession of Graffiti Tools with Intent
Lewd Behavior|56.53(c)|SDMC|M|Public Nudity
Lewd Behavior|314|PC|M|Indecent Exposure
Lewd Behavior|647(a)|PC|M|Lewd Act in Public
Keeping the Park Clean|44.0103|SDMC|I|Spitting Prohibited
Keeping the Park Clean|374.7(a)|PC|M|Polluting Waterway Within 150 Feet of High Water Mark
Minor Enforcement|56.61(a)|SDMC|I/J|Minor Consumption of Alcohol
Minor Enforcement|25662(a)|BPC|I/J|Minor in Possession of Alcohol
Minor Enforcement|58.04|SDMC|I/J|Minor in Possession of Tobacco
Minor Enforcement|594.1(e)(1)|PC|I/J|Minor in Possession of Aerosol Can
Weapons, Explosives, Fire|53.10(c)|SDMC|M|Discharge Firearms or Explosives Unauthorized
Weapons, Explosives, Fire|63.08|SDMC|M|Discharge of Firearms Prohibited
Weapons, Explosives, Fire|63.20.19|SDMC|I|Weapons or Firearms Prohibited
Weapons, Explosives, Fire|13002(a)|HSC|M|Fire Ignition Source
Dogs / Animals|63.0102(e)(2)|SDMC|I|Dog Bite Injury
Dogs / Animals|44.0304.1|SDMC|I|Dog Defecation Not Cleaned Up
Dogs / Animals|620(a)|SDCC|I|Dog License Required
Dogs / Animals|251.1|CCR|M|Harassment of Animals
Dogs / Animals|59.5.0502(c)(1)|SDMC|I|Loud Dogs in Permitted Site
Dogs / Animals|44.0305(a)|SDMC|I|Wild Animals and Prohibited Species
Dogs / Animals|44.0204|SDMC|I|Manure / Animal Excreta Prohibited
Dogs / Animals|44.0305(b)(3)(A)|SDMC|I|Boa or Snake Must Be in Cage
Dogs / Animals|62.0605|SDMC|I|Fastening Animals to Trees or Other Objects
Noise|59.5.0502(b)(1)|SDMC|M|Amplification
Noise|59.5.0502(f)|SDMC|I|Excessive Sound Over 65dB at 10 Feet
Drugs & Alcohol|25620(a)|BPC|I|No Alcohol in Undesignated Area
Drugs & Alcohol|56.56(a)|SDMC|I|Open Container of Alcohol
Drugs & Alcohol|56.54(b)|SDMC|I/M|Consumption of Alcohol
Drugs & Alcohol|23223(a)|CVC|I|Possess Alcohol in Vehicle Driver
Drugs & Alcohol|23224(a)|CVC|I|Possess Alcohol in Vehicle Under 21
Drugs & Alcohol|43.1002(g)|SDMC|I|Smoking or Vaping
Drugs & Alcohol|42.1303|SDMC|I|Smoking or Vaping Marijuana
Drugs & Alcohol|11364|HSC|M|Drug Paraphernalia
Drugs & Alcohol|4140|BPC|M|Syringe
Park Ranger|148(a)|PC|M|Obstruct or Delay
Park Ranger|52.05|SDMC|M|Furnish False Information to Peace Officer
Park Ranger|63.20.13|SDMC|I|Rules to be Followed / Posting
Park Ranger|62.0612|SDMC|I/M|Interference with Employee Prohibited
Vehicles|23127|CVC|M|Off-Roading Prohibited Where Clearly Marked
Vehicles|2146(a)|CVC|I|Disobey Official Traffic Sign Wrong Way
Vehicles|38319|CVC|I/M|Damage Environment While Operating Off-Highway Vehicle
Vehicles|23103(b)|CVC|M|Reckless Driving in Parking Area
Vehicles|38301|CVC|I|Operating Vehicle on Lands Not Authorized
Vehicles|21207.5(a)|CVC|I|Class 3 Bikes Prohibited on Trail
Vehicles|86.0137(b)|SDMC|I|Repair Vehicle Prohibited
Vehicles|38320(a)|CVC|I|Littering from Vehicle Likely to Injure Animal or Plant
Vehicles|22450(a)|CVC|I|Stop Sign Failure to Stop at Limit Line
Vehicles|141.0612(c)(10)|SDMC|I|Food Trucks Prohibited Coastal
Vehicles|142.0510(b)|SDMC|I|Parking Spaces to be Kept Clear
Abatement|54.0212(b)|SDMC|U|Abandoned Property Unsanitary
Abatement|54.0212(a)|SDMC|U|Abandoned Property Sanitary`;

const FULL_TEXT: Record<string, string> = {
  "CVC 31": "No person shall give false information to a peace officer while the officer is performing duties under the Vehicle Code.",
  "CVC 2800(a)": "It is unlawful to willfully fail or refuse to comply with a lawful order, signal, or direction of a peace officer.",
  "CVC 4000(a)(1)": "A vehicle shall not be driven, moved, or left standing on a highway or offstreet public parking facility unless registered and fees are paid.",
  "CVC 12500(a)": "A person shall not drive upon a highway unless the person holds a valid driver's license.",
  "CVC 12951(a)": "A driver shall have a valid driver's license in immediate possession when driving.",
  "CVC 16028(a)": "A driver shall provide evidence of financial responsibility when requested by a peace officer.",
  "CVC 21453(a)": "A driver facing a steady circular red signal shall stop at the limit line, crosswalk, or before entering the intersection.",
  "CVC 22450": "A driver approaching a stop sign shall stop at the limit line, crosswalk, or entrance to the intersecting roadway.",
  "CVC 22350": "A person shall not drive faster than is reasonable or prudent for conditions.",
  "CVC 23152(a)": "It is unlawful for a person under the influence of alcohol or drugs to drive a vehicle.",
  "SDMC 63.0108": "City of San Diego Park Rangers are authorized to enforce designated San Diego Municipal Code and California State Code violations in parks.",
  "PC 148(a)(1)": "A person shall not willfully resist, delay, or obstruct a peace officer in the discharge of duty.",
  "PC 242": "Battery is any willful and unlawful use of force or violence upon another person."
};

const INFO: Array<[string, string]> = [
  ["About", "Fast field reference for CVC, PC, HSC, BPC, SDMC, CCR, SDCC, UFC, and TOW entries."],
  ["Features", "Search by section, code, title, level, or category. The date page calculates an appearance date 8 weeks out and moves it to the next court day when needed."],
  ["Disclaimer", "For quick reference only. Verify current law, agency policy, court rules, and training before field use."]
];

const LEVEL_LABEL: Record<Level, string> = {
  I: "Infraction",
  M: "Misdemeanor",
  F: "Felony",
  TOW: "Tow / Impound",
  U: "Unclassified",
  "I/M": "Infraction / Misdemeanor",
  "I/J": "Juvenile / Infraction"
};

const LEVEL_CLASS: Record<Level, string> = {
  I: "bg-blue-100 text-blue-800",
  M: "bg-amber-100 text-amber-800",
  F: "bg-red-100 text-red-800",
  TOW: "bg-purple-100 text-purple-800",
  U: "bg-slate-100 text-slate-800",
  "I/M": "bg-indigo-100 text-indigo-800",
  "I/J": "bg-green-100 text-green-800"
};

const STATE_LAW_CODES: Record<string, string> = {
  CVC: "VEH",
  PC: "PEN",
  HSC: "HSC",
  BPC: "BPC"
};

const HOLIDAYS: Record<string, string> = {
  "2026-01-01": "New Year's Day", "2026-01-19": "Martin Luther King, Jr. Day", "2026-02-12": "Lincoln's Day", "2026-02-16": "Presidents' Day", "2026-03-31": "Farmworkers Day", "2026-05-25": "Memorial Day", "2026-06-19": "Juneteenth", "2026-07-03": "Independence Day Observed", "2026-09-07": "Labor Day", "2026-09-25": "Native American Day", "2026-11-11": "Veterans Day", "2026-11-26": "Thanksgiving Day", "2026-11-27": "Day After Thanksgiving", "2026-12-25": "Christmas Day",
  "2027-01-01": "New Year's Day", "2027-01-18": "Martin Luther King, Jr. Birthday", "2027-02-12": "President Lincoln's Birthday", "2027-02-15": "Presidents' Day", "2027-03-31": "Farmworkers Day", "2027-05-31": "Memorial Day", "2027-06-18": "Juneteenth", "2027-07-05": "Independence Day Observed", "2027-09-06": "Labor Day", "2027-09-24": "Native American Day", "2027-11-11": "Veterans Day", "2027-11-25": "Thanksgiving Day", "2027-11-26": "Day After Thanksgiving", "2027-12-24": "Christmas Day Observed", "2027-12-31": "New Year's Day 2028 Observed"
};

const COURT_OPEN_MINUTES = 8 * 60 + 30;
const COURT_CLOSE_MINUTES = 16 * 60;
const EIGHT_WEEKS_DAYS = 56;

function parseData(raw: string): Citation[] {
  const seen = new Set<string>();

  return raw
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [category = "Uncategorized", section = "", code = "", level = "U", ...title] = line.split("|");
      return {
        category,
        section,
        code,
        level: (level || "U") as Level,
        title: title.join("|") || "Untitled"
      };
    })
    .filter((item) => {
      const key = `${item.category}|${item.section}|${item.code}|${item.level}|${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const CITATIONS = parseData(DATA);
const CATEGORIES = ["all", ...Array.from(new Set(CITATIONS.map((item) => item.category))).sort()];

const citationKey = (item: Citation) => `${item.section}|${item.code}|${item.title}`;
const citationLine = (item: Citation) => `${item.section} ${item.code} [${item.level}] - ${item.title}`;

function officialUrl(item: Citation): string {
  const lawCode = STATE_LAW_CODES[item.code];
  if (!lawCode) return "";
  const section = item.section.replace(/\(.*/, "");
  return `https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=${lawCode}&sectionNum=${section}`;
}

function fullText(item: Citation): string {
  return FULL_TEXT[`${item.code} ${item.section}`] ??
    "Full statutory text has not been loaded for this section. Use the official link to verify the current text.";
}

function filterCitations(
  query: string,
  category: string,
  level: string,
  favoritesOnly: boolean,
  favorites: string[]
): Citation[] {
  const normalized = query.trim().toLowerCase();

  return CITATIONS.filter((item) => {
    const searchText = [
      item.section,
      item.code,
      item.level,
      LEVEL_LABEL[item.level],
      item.title,
      item.category
    ].join(" ").toLowerCase();

    return (!normalized || searchText.includes(normalized)) &&
      (category === "all" || item.category === category) &&
      (level === "all" || item.level === level) &&
      (!favoritesOnly || favorites.includes(citationKey(item)));
  }).sort((a, b) =>
    a.category.localeCompare(b.category) ||
    a.section.localeCompare(b.section, undefined, { numeric: true })
  );
}

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function toInputDateTime(date: Date): string {
  return `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalDateTime(value: string): Date {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if (![year, month, day, hour, minute].every(Number.isFinite)) return new Date();
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function calculateAppearance(issuedAt: string): AppearanceResult {
  const issued = parseLocalDateTime(issuedAt);
  const raw = new Date(issued);
  raw.setDate(raw.getDate() + EIGHT_WEEKS_DAYS);

  const adjusted = new Date(raw);
  adjusted.setHours(8, 30, 0, 0);

  const notes: string[] = [];

  while (adjusted.getDay() === 0 || adjusted.getDay() === 6 || HOLIDAYS[dateKey(adjusted)]) {
    notes.push(
      `${formatDate(adjusted)} is ${HOLIDAYS[dateKey(adjusted)] || "a weekend"}.`
    );
    adjusted.setDate(adjusted.getDate() + 1);
  }

  const issuedMinutes = issued.getHours() * 60 + issued.getMinutes();
  const issuedDuringCourtHours =
    issued.getDay() >= 1 &&
    issued.getDay() <= 5 &&
    issuedMinutes >= COURT_OPEN_MINUTES &&
    issuedMinutes <= COURT_CLOSE_MINUTES;

  return { issued, raw, adjusted, notes, issuedDuringCourtHours };
}

function runTests() {
  console.assert(parseData("A|1|CVC|I|Test").length === 1, "parseData failed");
  console.assert(filterCitations("52.5403", "all", "M", false, []).length > 0, "Drone code missing");
  console.assert(filterCitations("63.0102(c)(18)", "all", "I", false, []).length > 0, "Park rule missing");
  console.assert(filterCitations("56.55", "all", "I/M", false, []).length > 0, "I/M level missing");
  console.assert(filterCitations("56.61(a)", "all", "I/J", false, []).length > 0, "I/J level missing");
  console.assert(filterCitations("22651", "all", "TOW", false, []).length > 0, "Tow entries missing");
  console.assert(dateKey(calculateAppearance("2026-04-24T10:00").adjusted) === "2026-06-22", "Court-date adjustment failed");
  console.assert(filterCitations("MISCELLANEOUS PORT DISTRICT", "all", "all", false, []).length === 0, "Port District entry present");
  console.assert(filterCitations("NUDITY ON BEACH", "all", "all", false, []).length === 0, "Coronado MC entry present");
}
runTests();

function Badge({ level, children }: { level?: Level; children: React.ReactNode }) {
  const className = level ? LEVEL_CLASS[level] : "bg-slate-100 text-slate-800";
  return <span className={`rounded-xl px-2 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active
        ? "rounded-xl bg-slate-900 px-4 py-2 text-white"
        : "rounded-xl border bg-white px-4 py-2 text-slate-700"}
    >
      {children}
    </button>
  );
}

function CitationCard({
  item,
  saved,
  onSelect,
  onFavorite
}: {
  item: Citation;
  saved: boolean;
  onSelect: () => void;
  onFavorite: () => void;
}) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge>{item.category}</Badge>
            <Badge level={item.level}>{LEVEL_LABEL[item.level]}</Badge>
          </div>
          <h2 className="text-xl font-semibold hover:underline">{item.title}</h2>
          <p className="mt-1 font-mono text-lg text-slate-700">
            {item.section} {item.code} [{item.level}]
          </p>
        </button>

        <div className="grid grid-cols-2 gap-2 md:flex">
          <button type="button" onClick={onFavorite} className="h-11 rounded-xl border bg-white px-4">
            {saved ? "Unsave" : "Save"}
          </button>
          <button type="button" onClick={onSelect} className="h-11 rounded-xl bg-slate-900 px-4 text-white">
            Details
          </button>
        </div>
      </div>
    </article>
  );
}

function CitationDetails({ item, onClose }: { item: Citation; onClose: () => void }) {
  const url = officialUrl(item);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-details-title"
      onClick={onClose}
    >
      <section
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="citation-details-title" className="text-2xl font-bold">{item.title}</h2>
            <p className="mt-1 break-words font-mono text-lg text-slate-700">{citationLine(item)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{item.category}</Badge>
              <Badge level={item.level}>{LEVEL_LABEL[item.level]}</Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border bg-white px-4 py-2"
            aria-label="Close citation details"
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <h3 className="font-semibold">Full text</h3>
          <p className="mt-2 leading-relaxed text-slate-700">{fullText(item)}</p>
        </div>

        {url ? (
          <a
            className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-white"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            Open official code
          </a>
        ) : (
          <p className="mt-4 text-sm text-slate-600">No official state-code link is available for this local or special code.</p>
        )}
      </section>
    </div>
  );
}

function RadioCodesReference() {
  const [radioQuery, setRadioQuery] = useState("");
  const [radioGroup, setRadioGroup] = useState<(typeof RADIO_GROUPS)[number]>("All");

  const rows = useMemo(() => {
    const q = radioQuery.trim().toLowerCase();
    return RADIO_CODES.filter((item) =>
      (radioGroup === "All" || item.group === radioGroup) &&
      (!q || `${item.code} ${item.meaning} ${item.group}`.toLowerCase().includes(q))
    );
  }, [radioQuery, radioGroup]);

  const grouped = useMemo(() => {
    const map = new Map<RadioCode["group"], RadioCode[]>();
    rows.forEach((item) => map.set(item.group, [...(map.get(item.group) || []), item]));
    return map;
  }, [rows]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold">San Diego Radio Codes</h2>
        <p className="mt-2 text-slate-700">
          Quick-reference scanner terminology organized by type. Search a code such as 10-97, 11-99, Code 4, PC 415, or a plain-language meaning.
        </p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Scanner reference only. Radio terminology varies by agency and changes over time. The statute section is shorthand from the source list, not a substitute for the Citation Lookup or current official law.
        </div>

        <input
          value={radioQuery}
          onChange={(event) => setRadioQuery(event.target.value)}
          placeholder="Search radio code or meaning"
          className="mt-4 h-11 w-full rounded-xl border bg-white px-3"
        />

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {RADIO_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setRadioGroup(group)}
              className={radioGroup === group
                ? "whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-sm text-white"
                : "whitespace-nowrap rounded-xl border bg-white px-3 py-2 text-sm text-slate-700"}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {[...grouped.entries()].map(([group, items]) => (
        <section key={group} className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-end justify-between gap-4">
            <h3 className="text-xl font-bold">{group}</h3>
            <span className="text-sm text-slate-500">{items.length} entries</span>
          </div>
          <div className="divide-y">
            {items.map((item) => (
              <div key={`${group}-${item.code}-${item.meaning}`} className="grid gap-1 py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
                <div className="font-mono font-bold text-slate-900">{item.code}</div>
                <div className="text-slate-700">{item.meaning}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {rows.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">
          No matching radio code found.
        </div>
      )}
    </section>
  );
}

function DateCalculator({ issuedAt, onChange }: { issuedAt: string; onChange: (value: string) => void }) {
  const result = useMemo(() => calculateAppearance(issuedAt), [issuedAt]);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">Citation Date Calculator</h2>
      <p className="mt-2 text-slate-700">
        Appearance date is set 8 weeks from issuance and moved to the next listed court day when it falls on a weekend or court holiday.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-sm font-semibold">Citation issued date and time</span>
          <input
            type="datetime-local"
            value={issuedAt}
            onChange={(event) => onChange(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border bg-white px-3"
          />
        </label>

        <div className="rounded-xl border bg-slate-50 p-4">
          <p className="text-sm font-semibold">Appearance date</p>
          <p className="mt-2 text-2xl font-bold">{formatDate(result.adjusted)}</p>
          <p className="text-lg text-slate-700">{formatTime(result.adjusted)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="font-semibold">Issued</p>
          <p>{formatDate(result.issued)}</p>
          <p>{formatTime(result.issued)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="font-semibold">Raw 8-week date</p>
          <p>{formatDate(result.raw)}</p>
          <p>8:30 AM</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="font-semibold">Court hours</p>
          <p>{result.issuedDuringCourtHours ? "Issued during court hours" : "Issued outside court hours"}</p>
          <p className="text-sm text-slate-600">8:30 AM to 4:00 PM</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <h3 className="font-semibold">Adjustment notes</h3>
        {result.notes.length ? (
          <ul className="mt-2 list-disc pl-5">
            {result.notes.map((note) => <li key={note}>{note}</li>)}
            <li>Moved to {formatDate(result.adjusted)} at {formatTime(result.adjusted)}.</li>
          </ul>
        ) : (
          <p className="mt-2">No weekend or holiday adjustment was needed.</p>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Verify against current SDSC rules, court location instructions, agency policy, and updated holiday schedules before issuing.
      </div>
    </section>
  );
}

export default function EnforcementCitationLookup() {
  const [page, setPage] = useState<Page>("lookup");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selected, setSelected] = useState<Citation | null>(null);
  const [issuedAt, setIssuedAt] = useState(() => toInputDateTime(new Date()));

  const shown = useMemo(
    () => filterCitations(query, category, level, page === "favorites", favorites),
    [query, category, level, page, favorites]
  );

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setLevel("all");
    setSelected(null);
  };

  const toggleFavorite = (item: Citation) => {
    const key = citationKey(item);
    setFavorites((current) =>
      current.includes(key) ? current.filter((value) => value !== key) : [...current, key]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b bg-white p-4 shadow-sm">
        <div className="mx-auto max-w-6xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Enforcement Citation Lookup</h1>
            <p className="text-slate-600">Fast CVC, PC, HSC, BPC, SDMC, CCR, SDCC, UFC, and TOW lookup.</p>
          </div>

          <nav className="grid grid-cols-5 gap-2">
            <TabButton active={page === "lookup"} onClick={() => setPage("lookup")}>Lookup</TabButton>
            <TabButton active={page === "radio"} onClick={() => setPage("radio")}>Radio</TabButton>
            <TabButton active={page === "date"} onClick={() => setPage("date")}>Date</TabButton>
            <TabButton active={page === "favorites"} onClick={() => setPage("favorites")}>
              Favorites{favorites.length ? ` ${favorites.length}` : ""}
            </TabButton>
            <TabButton active={page === "info"} onClick={() => setPage("info")}>Info</TabButton>
          </nav>

          {(page === "lookup" || page === "favorites") && (
            <div className="grid gap-3 md:grid-cols-4">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search code, section, or violation"
                className="h-11 rounded-xl border bg-white px-3 md:col-span-2"
              />

              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border bg-white px-3">
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>{value === "all" ? "All categories" : value}</option>
                ))}
              </select>

              <select value={level} onChange={(event) => setLevel(event.target.value)} className="h-11 rounded-xl border bg-white px-3">
                <option value="all">All levels</option>
                {(Object.keys(LEVEL_LABEL) as Level[]).map((value) => (
                  <option key={value} value={value}>{LEVEL_LABEL[value]}</option>
                ))}
              </select>

              <button type="button" onClick={resetFilters} className="h-11 rounded-xl border bg-white px-4 md:col-span-4">
                Clear
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4 pb-24">
        {page === "radio" && <RadioCodesReference />}

        {page === "date" && <DateCalculator issuedAt={issuedAt} onChange={setIssuedAt} />}

        {page === "info" && INFO.map(([title, body]) => (
          <section key={title} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-slate-700">{body}</p>
          </section>
        ))}

        {(page === "lookup" || page === "favorites") && (
          <>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-medium">{shown.length} of {CITATIONS.length} shown</p>
              <p className="mt-1 text-sm text-slate-600">Click a violation to view details.</p>
            </div>

            {selected && <CitationDetails item={selected} onClose={() => setSelected(null)} />}

            {shown.map((item) => (
              <CitationCard
                key={citationKey(item)}
                item={item}
                saved={favorites.includes(citationKey(item))}
                onSelect={() => setSelected(item)}
                onFavorite={() => toggleFavorite(item)}
              />
            ))}

            {shown.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">
                No matching citation found.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
