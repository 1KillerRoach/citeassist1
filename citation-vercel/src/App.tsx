import React, { useMemo, useState } from "react";

type Page = "lookup" | "radio" | "alphabet" | "subject" | "beat" | "date" | "favorites" | "info";
type Level = "I" | "M" | "F" | "TOW" | "U" | "I/M" | "I/J";

type Citation = {
  category: string;
  section: string;
  code: string;
  level: Level;
  title: string;
};


const SDPD_PHONETIC_ALPHABET: Array<[string, string]> = [
  ["A", "Adam"],
  ["B", "Boy"],
  ["C", "Charles"],
  ["D", "David"],
  ["E", "Edward"],
  ["F", "Frank"],
  ["G", "George"],
  ["H", "Henry"],
  ["I", "Ida"],
  ["J", "John"],
  ["K", "King"],
  ["L", "Lincoln"],
  ["M", "Mary"],
  ["N", "Nora"],
  ["O", "Ocean"],
  ["P", "Paul"],
  ["Q", "Queen"],
  ["R", "Robert"],
  ["S", "Sam"],
  ["T", "Tom"],
  ["U", "Union"],
  ["V", "Victor"],
  ["W", "William"],
  ["X", "X-Ray"],
  ["Y", "Young"],
  ["Z", "Zebra"]
];

type BeatProperties = {
  beat?: number | string;
  div?: number | string;
  serv?: number | string;
  name?: string;
  neighborhood?: string;
};

type BeatResult = {
  beat: string;
  neighborhood: string;
  serviceArea: string;
  division: string;
  address: string;
  lat: number;
  lon: number;
  accuracy?: number;
  geocodeScore?: number;
};

const DIVISION_NAMES: Record<string, string> = {
  "1": "Northern",
  "2": "Northeastern",
  "3": "Eastern",
  "4": "Southeastern",
  "5": "Central",
  "6": "Western",
  "7": "Southern",
  "8": "Mid-City",
  "9": "Northwestern"
};

async function findBeatAtPoint(lat: number, lon: number): Promise<BeatProperties | null> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const response = await fetch(`/api/beat?${params.toString()}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Unable to check the police beat.");
  }

  const data = await response.json();
  return data?.properties || null;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; address: string; score: number }> {
  const params = new URLSearchParams({ address });
  const response = await fetch(`/api/geocode?${params.toString()}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Address lookup failed.");
  }

  return response.json();
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const response = await fetch(`/api/reverse-geocode?${params.toString()}`);

  if (!response.ok) return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  const data = await response.json();
  return data?.address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

function normalizeBeatResult(
  properties: BeatProperties,
  location: { lat: number; lon: number; address: string; accuracy?: number; geocodeScore?: number }
): BeatResult {
  const beat = String(properties.beat ?? "").trim();
  const divisionNumber = String(properties.div ?? "").trim();
  const serviceArea = String(properties.serv ?? (beat ? beat.slice(0, 2) + "0" : "")).trim();

  return {
    beat: beat || "Unknown",
    neighborhood: String(properties.name ?? properties.neighborhood ?? "Unknown"),
    serviceArea: serviceArea || "Unknown",
    division: DIVISION_NAMES[divisionNumber] || (divisionNumber ? `Division ${divisionNumber}` : "Unknown"),
    address: location.address,
    lat: location.lat,
    lon: location.lon,
    accuracy: location.accuracy,
    geocodeScore: location.geocodeScore
  };
}

type RadioCode = {
  group: "10-Codes" | "11-Codes" | "SDPD Codes" | "Disposition" | "Sheriff Terms" | "Stations" | "Scanner Statutes" | "Unit Designators" | "Call Sign Guide";
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
  ["Scanner Statutes","W&I 5150","Danger to self or others (mental health hold reference)"],

  ["Unit Designators","C","Captain"],
  ["Unit Designators","L","Lieutenant"],
  ["Unit Designators","S","Patrol Sergeant"],
  ["Unit Designators","D","Detective"],
  ["Unit Designators","A","Alpha / overtime officer; handles calls for service"],
  ["Unit Designators","B","One-officer extra unit, first and third watch"],
  ["Unit Designators","BK","Bike unit"],
  ["Unit Designators","E","Juvenile Services Team or Traffic Grant Detail enforcement unit"],
  ["Unit Designators","F","Special Events Traffic Controller"],
  ["Unit Designators","G","Officer with trainee, first and third watch"],
  ["Unit Designators","GS","Gang Suppression Team"],
  ["Unit Designators","H","Patrol trainee, observation phase"],
  ["Unit Designators","I","Impound / Abatement unit"],
  ["Unit Designators","J","One-officer unit, first and third watch"],
  ["Unit Designators","K","Two-officer unit, first and third watch"],
  ["Unit Designators","M","Traffic Motor unit"],
  ["Unit Designators","N","Canine unit"],
  ["Unit Designators","O","Indochinese Service Officer (ISO)"],
  ["Unit Designators","P","Parking Enforcement unit"],
  ["Unit Designators","PG","PISO trainee, first and third watch"],
  ["Unit Designators","PU","PISO trainee, second watch"],
  ["Unit Designators","PT","PERT officer with clinician"],
  ["Unit Designators","Q","Special detail unit"],
  ["Unit Designators","RO","Police Investigative Service Officer (PISO)"],
  ["Unit Designators","RS","Retired Senior Volunteer Patrol traffic unit"],
  ["Unit Designators","RSV","Retired Senior Volunteer Patrol"],
  ["Unit Designators","T","Traffic unit"],
  ["Unit Designators","U","Officer with trainee, second watch"],
  ["Unit Designators","V","One-officer extra unit, second watch"],
  ["Unit Designators","W","Two-officer extra unit, second watch"],
  ["Unit Designators","WK","Walking unit"],
  ["Unit Designators","X","Two-officer extra unit, first and third watch"],
  ["Unit Designators","Y","One-officer unit, second watch"],
  ["Unit Designators","Z","Two-officer unit, second watch"],

  ["Call Sign Guide","831J1","8 = Mid-City area command; 3 = service area; 1 = primary beat officer; J = one-officer unit; 1 = first watch"],
  ["Call Sign Guide","50s","Juvenile services teams, power squads, C squads, or established special details"],
  ["Call Sign Guide","60s","Special details"],
  ["Call Sign Guide","70s","Special details"],
  ["Call Sign Guide","80s","Special details"],
  ["Call Sign Guide","90s","Area command narcotic units"],
  ["Call Sign Guide","88 / 99","Designators ending in 88 or 99 are not used because they can be misheard as emergency codes"],
  ["Call Sign Guide","L1-L5","Field lieutenants / watch commander identifiers"],
  ["Call Sign Guide","RSV + beat","Retired Senior Volunteer Patrol units use the beat number in the call sign"]
].map(([group, code, meaning]) => ({ group: group as RadioCode["group"], code, meaning }));

const RADIO_GROUPS: Array<"All" | RadioCode["group"]> = [
  "All", "10-Codes", "11-Codes", "SDPD Codes", "Unit Designators", "Call Sign Guide",
  "Disposition", "Sheriff Terms", "Stations", "Scanner Statutes"
];

type AppearanceResult = {
  issued: Date;
  raw: Date;
  adjusted: Date;
  notes: string[];
  issuedDuringCourtHours: boolean;
};

const DATA = `General Enforcement|31|CVC|M|False Information
General Enforcement|2800(a)|CVC|M|Fail to obey Lawful Order
General Enforcement|2800.1(a)|CVC|M|Evading Peace Officer (marked veh)
General Enforcement|2800.1(b)|CVC|M|Evading Peace Officer (marked bicycle)
General Enforcement|2800.2|CVC|F|Evade: Reckless Driving
General Enforcement|2818|CVC|I|Flare or Cone Pattern: Traverse
Vehicles & Parking|4000(a)(1)|CVC|I|Unregistered Vehicle
Vehicles & Parking|4159|CVC|I|Notify DMV Address Change (10 days)
Vehicles & Parking|4160|CVC|I|Address Change on Registration in ink (10 days)
Vehicles & Parking|4454(a)|CVC|I|Registration: not in veh (CA registered)
Vehicles & Parking|4462(a)|CVC|I|Registration: not in veh (out of state)
Vehicles & Parking|4462(b)|CVC|I|Display/Present/Use Wrong reg/tab/plate
Vehicles & Parking|4462.5|CVC|M|Above: w/intent to avoid Registration Fees
Vehicles & Parking|4463(a)(1)|CVC|F|Counterfeit Reg/tab/plate
Vehicles & Parking|4464|CVC|I|Altered License Plate
Vehicles & Parking|5200|CVC|I|License Plates: 2 attached front/rear
Vehicles & Parking|5201|CVC|I|License Plates: Securely Mounted: rear 12-16 in, front under 60 in
Vehicles & Parking|5201(f)|CVC|I|License Plates: Covered
Vehicles & Parking|5201(g)|CVC|I|License Plates: Obscured
Vehicles & Parking|5204|CVC|I|Expired Registration Tabs
Vehicles & Parking|12500(a)|CVC|M|Unlicensed Driver
Vehicles & Parking|12500(b)|CVC|I|Motorcycle: M1 or M2 License Required
Vehicles & Parking|12511|CVC|I|No more than one DL
Vehicles & Parking|12509.5(c)|CVC|I|Motorcycle Instruction Permit Restrictions
Vehicles & Parking|12814.6(a)(1)|CVC|I|Failure to obey instructional permit restrictions
Vehicles & Parking|12814.6(b)(1)|CVC|I|Failure to obey Provisional License restrictions
Vehicles & Parking|12815(a)|CVC|I|DL Mutilated
Vehicles & Parking|12951(a)|CVC|I|DL not in possession
Vehicles & Parking|12951(b)|CVC|M|Refuse to Present DL
Vehicles & Parking|14600(a)|CVC|I|Change of Address
Vehicles & Parking|14601(a)|CVC|M|Suspended or Revoked: Reckless
Vehicles & Parking|14601.1(a)|CVC|M|Suspended or Revoked: Not Driving Related
Vehicles & Parking|14601.2(a)|CVC|M|Suspended or Revoked: DUI
Vehicles & Parking|14603|CVC|I|Disobey License Restrictions
Vehicles & Parking|14610(a)(3)|CVC|M|Display Another Person's Driver License
Vehicles & Parking|14610(a)(8)|CVC|M|Alter Driver License
Vehicles & Parking|16028(a)|CVC|I|Proof of Insurance
Vehicles & Parking|21201(d)(1)|CVC|I|Bike Light Visible 300 feet
Vehicles & Parking|21203|CVC|I|Hitching a Ride
Vehicles & Parking|21212|CVC|I|Bicycle Helmet under 18
Vehicles & Parking|21650.1|CVC|I|Riding against traffic
Vehicles & Parking|21210|CVC|I|Bike blocking sidewalk
Vehicles & Parking|21205|CVC|I|At least one hand on handlebars
Vehicles & Parking|21201(a)|CVC|I|Brake Required
Vehicles & Parking|21204(a)|CVC|I|Rider must ride on permanent attached seat
Vehicles & Parking|21204(b)|CVC|I|Passenger on bicycle other than seat
Vehicles & Parking|21453(a)|CVC|I|Red Light
Vehicles & Parking|21453(b)|CVC|I|Yield Before Right Turn on Red
Vehicles & Parking|21453(c)|CVC|I|Red Arrow Signal
Vehicles & Parking|22450|CVC|I|Stop Sign
Vehicles & Parking|21453(d)|CVC|I|Pedestrian Cross Against Red
Vehicles & Parking|21457(a)|CVC|I|Flashing Red Signal
Vehicles & Parking|21460(a)|CVC|I|Double Solid Lines
Vehicles & Parking|21461(a)|CVC|I|Disobeying Signs
Vehicles & Parking|21650|CVC|I|Driving: Wrong Side of Roadway
Vehicles & Parking|21651(a)(1)|CVC|I|Divided Highway Island On, Over, or Across
Vehicles & Parking|21651(a)(2)|CVC|I|Divided Highway Turn Across
Vehicles & Parking|21651(b)|CVC|M|Wrong Way on Divided Highway
Vehicles & Parking|21655.5|CVC|I|Carpool Lanes
Vehicles & Parking|21657|CVC|I|Wrong Way
Vehicles & Parking|21658(a)|CVC|I|Unsafe Lane Change or Straddling
Vehicles & Parking|21663|CVC|I|Driving on Sidewalk
Vehicles & Parking|21703|CVC|I|Following Too Closely
Vehicles & Parking|21706|CVC|I|Follow Emergency Vehicle Within 300 Feet
Vehicles & Parking|21708|CVC|I|Drive Over Fire Hose
Vehicles & Parking|21755(a)|CVC|I|Passing on Right When Unlawful
Vehicles & Parking|21800(a)|CVC|I|Uncontrolled Intersection
Vehicles & Parking|21800(c)|CVC|I|4 Way Stop
Vehicles & Parking|21802(a)|CVC|I|Enter from a Stop Sign
Vehicles & Parking|21803(a)|CVC|I|Yield Sign
Vehicles & Parking|21804(a)|CVC|I|Enter or Cross a Highway
Vehicles & Parking|21806(a)(1)|CVC|I|Yield to Code-3 Emergency Vehicle
Vehicles & Parking|21950(a)|CVC|I|Pedestrian in Crosswalk: Driver Yield
Vehicles & Parking|22100(a)|CVC|I|Right Turn from Right Side
Vehicles & Parking|22100(b)|CVC|I|Left Turn from Left Side
Vehicles & Parking|22100.1|CVC|I|U-Turn from Far Left Lane
Vehicles & Parking|22101(d)|CVC|I|Turns Required or Prohibited by Sign
Vehicles & Parking|22102|CVC|I|U Turn Business District
Vehicles & Parking|22103|CVC|I|U Turn Residence District
Vehicles & Parking|22104|CVC|I|U Turn Fire Station
Vehicles & Parking|22106|CVC|I|Unsafe Backing or Starting
Vehicles & Parking|22107|CVC|I|Unsafe Turn or Failure to Signal
Vehicles & Parking|22108|CVC|I|Turn Signal Required 100 Feet Before Turn
Vehicles & Parking|22348(b)|CVC|I|Excessive Speed Over 100 MPH
Vehicles & Parking|22349(a)|CVC|I|Max Speed 65 MPH
Vehicles & Parking|22350|CVC|I|Unsafe Speed
Vehicles & Parking|22400(a)|CVC|I|Minimum Speed or Impede Traffic
Vehicles & Parking|22405(a)|CVC|I|Speed on Bridge
Vehicles & Parking|22411|CVC|I|Scooter 15 MPH Max
Vehicles & Parking|22526(a)|CVC|I|Gridlock Driving Straight
Vehicles & Parking|22526(b)|CVC|I|Gridlock Turning Without Room
Vehicles & Parking|23103(a)|CVC|M|Reckless Driving Highway
Vehicles & Parking|23103(b)|CVC|M|Reckless Driving Parking Lot
Vehicles & Parking|23109(a)|CVC|M|Speed Contest
Vehicles & Parking|23109(b)|CVC|M|Aid or Abet Speed Contest
Vehicles & Parking|23109(c)|CVC|M|Exhibition of Speed
Vehicles & Parking|23110(a)|CVC|M|Throw Substance at Vehicle
Vehicles & Parking|23110(b)|CVC|F|Throw Substance at Vehicle with Intent to Cause GBI
Vehicles & Parking|23116(a) or (b)|CVC|I|Passenger in Bed of Pick Up
Vehicles & Parking|23111|CVC|I|Throw Cigarette or Burning Item
Vehicles & Parking|23112(a)|CVC|I|Litter on Highway
Vehicles & Parking|23117(a)|CVC|I|Untethered Animal in Truck Bed
Vehicles & Parking|21223(a)(1)|CVC|I|Front Light Required
Vehicles & Parking|21228(a)|CVC|I|Too Slow or Not Riding on Right
Vehicles & Parking|21229(a)|CVC|I|Required to Ride in Marked Bike Lane
Vehicles & Parking|21229(b)|CVC|I|Unsafe Lane Change or Fail to Signal
Vehicles & Parking|21235(b)|CVC|I|Helmet Required
Vehicles & Parking|21235(d)|CVC|I|Operate Under 16 Years Old
Vehicles & Parking|21235(g)|CVC|I|Ride on Sidewalk
Drugs, Alcohol & Tobacco|21200.5|CVC|M|DUI on a Bike
Drugs, Alcohol & Tobacco|21221.5|CVC|M|DUI Scooter BAC .08 or Greater
Drugs, Alcohol & Tobacco|23136(a)|CVC|I|Under 21 BAC .01 or Greater
Drugs, Alcohol & Tobacco|23140|CVC|I|DUI Under 21 BAC .05 or Greater
Drugs, Alcohol & Tobacco|23152(a)|CVC|M|DUI Driving Under the Influence
Drugs, Alcohol & Tobacco|23152(b)|CVC|M|DUI BAC .08 or Greater
Drugs, Alcohol & Tobacco|23153|CVC|F|DUI with Injury
Drugs, Alcohol & Tobacco|23154(a)|CVC|M|DUI Probationer BAC .01 or Greater
Drugs, Alcohol & Tobacco|23220|CVC|I|Drive While Drinking
Drugs, Alcohol & Tobacco|23221|CVC|I|Drinking in Vehicle Upon Highway
Drugs, Alcohol & Tobacco|23222(a)|CVC|I|Open Container Driver While Driving
Drugs, Alcohol & Tobacco|23223(a)|CVC|I|Open Container Driver Parked
Drugs, Alcohol & Tobacco|23223(b)|CVC|I|Open Container Passenger
Drugs, Alcohol & Tobacco|23222(b)|CVC|M|Marijuana in Vehicle Less Than 28.5g
Drugs, Alcohol & Tobacco|23224(a)|CVC|I|Driver Under 21 Transport Alcohol
Drugs, Alcohol & Tobacco|23224(b)|CVC|I|Passenger Under 21 Possess Alcohol
Drugs, Alcohol & Tobacco|308(b)|PC|I|Minor 16-18 Possess Tobacco
Vehicles & Parking|23123(a)|CVC|I|Cell Phone Use While Driving
Vehicles & Parking|23123.5(a)|CVC|I|Texting While Driving
Vehicles & Parking|23124(b)|CVC|I|Under 18 Use Cell Phone
Vehicles & Parking|26708(2)|CVC|I|View Obstructed by Object or Material
Vehicles & Parking|23120|CVC|I|Operate Vehicle with Wide Temple Glasses
Vehicles & Parking|24250|CVC|I|Drive Without Required Lights During Darkness
Vehicles & Parking|24252(a)|CVC|I|Lighting Devices in Good Working Order
Vehicles & Parking|24400|CVC|I|Headlamps Required
Vehicles & Parking|24403|CVC|I|Fog Lamps Not in Place of Headlamps
Vehicles & Parking|24405(a)|CVC|I|Forward Lamps Not to Exceed 4
Vehicles & Parking|24409(a)|CVC|I|Failure to Dim High Beams Oncoming
Vehicles & Parking|24409(b)|CVC|I|Failure to Dim High Beams Following
Vehicles & Parking|24600|CVC|I|Tail Lamps Required
Vehicles & Parking|24601|CVC|I|License Plate Light Required
Vehicles & Parking|24603(b)|CVC|I|Stop Lamps Required
Vehicles & Parking|24606(c)|CVC|I|Backup Lamps Used Other Than Backing
Vehicles & Parking|24951(b)(1)|CVC|I|Turn Signals Required Front and Rear
Vehicles & Parking|25400(a)|CVC|I|Improper Lights to Front
Vehicles & Parking|25400(b)|CVC|I|Modified Lights or Equipment Color
Vehicles & Parking|26101(b)|CVC|I|Modify Lights or Equipment Color
Vehicles & Parking|26707|CVC|I|Windshield Wipers
Vehicles & Parking|26708(a)(1)|CVC|I|Window Obstructed
Vehicles & Parking|26708(b)|CVC|I|View Obstructed
Vehicles & Parking|26708.5|CVC|I|Window Tint
Vehicles & Parking|26709(a)|CVC|I|Rear View Mirror Required
Vehicles & Parking|26709(b)|CVC|I|Side View Mirrors Required
Vehicles & Parking|26710|CVC|I|Defective Windshield
Vehicles & Parking|27000|CVC|I|Horn Required
Vehicles & Parking|27007|CVC|I|Loud Stereo Greater Than 50 Feet
Vehicles & Parking|27150(a)|CVC|I|Muffler Defective or Excessive Noise
Vehicles & Parking|27155|CVC|I|Gas Cap Required
Vehicles & Parking|27315(d)|CVC|I|Seatbelt Required Driver
Vehicles & Parking|27315(e)|CVC|I|Seatbelt Required Passenger
Vehicles & Parking|27360(a)|CVC|I|Child Seat Parent
Vehicles & Parking|27360(b)|CVC|I|Child Seat Driver
Vehicles & Parking|27400|CVC|I|Headset or Earplugs Cover Both Ears
Vehicles & Parking|27465(b)|CVC|I|Bald Tires
Vehicles & Parking|27600|CVC|I|Fenders or Mudguards Required
Vehicles & Parking|28701|CVC|I|Bumpers Required
Vehicles & Parking|27803(b)|CVC|I|Motorcycle Helmet Required
Vehicles & Parking|22651(a)|CVC|TOW|Unattended on Bridge
Vehicles & Parking|22651(b)|CVC|TOW|Blocks Highway
Vehicles & Parking|22651(c)|CVC|TOW|Stolen or Embezzled
Vehicles & Parking|22651(d)|CVC|TOW|Blocking Driveway
Vehicles & Parking|22651(e)|CVC|TOW|Blocking Fire Hydrant
Vehicles & Parking|22651(h)(1)|CVC|TOW|Driver Arrested
Vehicles & Parking|22651(h)(2)|CVC|TOW|Alcohol Screen Test Driver Under 21
Vehicles & Parking|22651(i)(1)|CVC|TOW|5 or More Parking Violations
Vehicles & Parking|22651(k)|CVC|TOW|72 Hour Violation
Vehicles & Parking|22651(n)|CVC|TOW|Posted Signs
Vehicles & Parking|22651(o)(1)|CVC|TOW|Expired Registration 6 Months
Vehicles & Parking|22651(o)(2)|CVC|TOW|Expired Registration Off Street
Vehicles & Parking|22651(p)|CVC|TOW|12500 and 14601 Violations
Vehicles & Parking|22651.5(a)|CVC|TOW|Alarm or Horn 45 Minutes
Vehicles & Parking|22669(a)|CVC|TOW|Abandoned Vehicle
Vehicles & Parking|22669(b)|CVC|TOW|Vehicle Public Hazard
Vehicles & Parking|22655(a)|CVC|TOW|Involved in Hit and Run
Vehicles & Parking|22655.5|CVC|TOW|Impound for Investigation
Fire & Emergency|12676|HSC|M|Fireworks Unlawful Sales
Fire & Emergency|12677|HSC|M|Fireworks Possession
Fire & Emergency|12680|HSC|M|Fireworks Unlawful Discharge
Fire & Emergency|78.1028|UFC|M|Fireworks Possess, Use, Explode, Store, or Sell
Drugs, Alcohol & Tobacco|25661|BPC|I|Possess False ID by Minor
Drugs, Alcohol & Tobacco|25662(a)|BPC|M|Minor Possess Alcohol in Public
Drugs, Alcohol & Tobacco|25668(a)|BPC|M|Minor Sell or Furnish Alcohol to Under 21
Drugs, Alcohol & Tobacco|25668(b)|BPC|M|Minor Buy or Consume Alcohol
Drugs, Alcohol & Tobacco|25668(c)|BPC|M|Purchase or Furnish Alcohol to Minor
Drugs, Alcohol & Tobacco|25668(d)|BPC|M|Allow Minor to Consume Alcohol in Bar
Public Safety & Conduct|136.1|PC|F|DV Dissuading Witness or Victim
Public Safety & Conduct|236|PC|F|DV False Imprisonment
Public Safety & Conduct|243(e)(1)|PC|F|DV Battery
Public Safety & Conduct|273.5|PC|F|DV Injury to Spouse or Cohabitant
Public Safety & Conduct|591|PC|F|DV Injury to Phone Line
Public Safety & Conduct|646.9(a)|PC|F|DV Stalking
Public Safety & Conduct|646.9(b)|PC|F|DV Stalking with TRO
Public Safety & Conduct|13730|PC|F|DV Incident Report
Public Safety & Conduct|166(a)(4)|PC|M|Court Order Violation Criminal
Public Safety & Conduct|215(a)|PC|F|Carjacking
Public Safety & Conduct|245(a)(1)|PC|F|ADW or GBI Other Than Firearm
Public Safety & Conduct|245(a)(2)|PC|F|ADW Firearm
Public Safety & Conduct|273.6|PC|M|Court Order Civil DV or EPO
Public Safety & Conduct|243(a)|PC|M|Battery
Public Safety & Conduct|374.3(a)|PC|I|Urinating in Public or Waste Matter
Public Safety & Conduct|374.4|PC|I|Littering
Public Safety & Conduct|140|PC|F|Threatening Witness
Public Safety & Conduct|148(a)(1)|PC|M|Resist Delay Obstruct
Public Safety & Conduct|148.5|PC|M|False Police Report
Public Safety & Conduct|148.9(a)|PC|M|False Identity to Officer
Public Safety & Conduct|422|PC|M|Criminal Threats
Public Safety & Conduct|314|PC|U|Lewd or Obscene Acts
Public Safety & Conduct|370|PC|M|Public Nuisance
Public Safety & Conduct|451|PC|F|Arson
Public Safety & Conduct|466|PC|M|Burglary Tools
Public Safety & Conduct|470|PC|F|Forgery
Public Safety & Conduct|485|PC|F|Misappropriation of Found Property
Public Safety & Conduct|487|PC|F|Grand Theft Over 950
Public Safety & Conduct|488|PC|M|Petty Theft Under 950
Public Safety & Conduct|3056|PC|U|Parole Violation Hold
Public Safety & Conduct|21510|PC|M|Switchblade
Public Safety & Conduct|25400(a)|PC|M|Concealed Firearm
Public Safety & Conduct|25850(a)|PC|M|Loaded Firearm Open Carry
Public Safety & Conduct|Various|PC|F|Possession of Weapon
Drugs, Alcohol & Tobacco|11350|HSC|F|Drugs Possession
Drugs, Alcohol & Tobacco|11351|HSC|F|Drugs Possession for Sales
Drugs, Alcohol & Tobacco|11352|HSC|F|Drugs Sell Furnish Give Transport
Drugs, Alcohol & Tobacco|11368|HSC|F|Forged or Altered Prescription
Drugs, Alcohol & Tobacco|11357(a)|HSC|F|Drugs Possession More Than 28.5g
Drugs, Alcohol & Tobacco|11357(b)|HSC|F|Drugs Possession Less Than 28.5g
Drugs, Alcohol & Tobacco|11359|HSC|F|Drugs Possession for Sales
Drugs, Alcohol & Tobacco|11360(a)|HSC|F|Drugs Sell or Furnish
Drugs, Alcohol & Tobacco|11361|HSC|F|Drugs Use of or Sales to Minor
Drugs, Alcohol & Tobacco|11358|HSC|F|Drugs Cultivate Harvest Process
Drugs, Alcohol & Tobacco|11377|HSC|U|Possession
Drugs, Alcohol & Tobacco|11378|HSC|F|Drugs Possession for Sales
Drugs, Alcohol & Tobacco|11379(a)|HSC|F|Drugs Sell Furnish Give Transport
Drugs, Alcohol & Tobacco|11380|HSC|F|Drugs Use of or Sales to Minor
Drugs, Alcohol & Tobacco|11357|HSC|F|Under the Influence of Controlled Substance
Drugs, Alcohol & Tobacco|11391|HSC|F|Mushrooms Transport or Sell
Drugs, Alcohol & Tobacco|11364|HSC|M|Possession of Paraphernalia
Drugs, Alcohol & Tobacco|4140|BPC|M|Possess Hypodermic Needle
Drugs, Alcohol & Tobacco|4060|BPC|M|Possess Prescription Drug Without Prescription
Vehicles & Parking|5200|CVC|I|License Plates Missing Parked
Vehicles & Parking|5204|CVC|I|Expired Tags Parked
Vehicles & Parking|22500(a)|CVC|I|Parking in Intersection
Vehicles & Parking|22500(b)|CVC|I|Parking in Crosswalk
Vehicles & Parking|22500(c)|CVC|I|Parked Red Curb or Safety Zone
Vehicles & Parking|22500(d)|CVC|I|Parked Within 15 Feet of Fire Department Driveway
Vehicles & Parking|22500(e)(1)|CVC|I|Parked Blocking Driveway
Vehicles & Parking|22500(f)|CVC|I|Parking on or Across Sidewalk
Vehicles & Parking|22500(h)|CVC|I|Double Parking
Vehicles & Parking|22500(i)|CVC|I|Parking in Bus Loading Zone
Vehicles & Parking|22500.1|CVC|I|Stop Stand Park in Fire Lane
Vehicles & Parking|22502a|CVC|I|Parked Wrong Side or Over 18 Inches from Curb
Vehicles & Parking|22505b|CVC|I|Parked on Posted Highway
Vehicles & Parking|22514|CVC|I|Parked Within 15 Feet of Hydrant
Vehicles & Parking|22507.8a|CVC|I|Disabled Parking Space
Vehicles & Parking|22507.8c|CVC|I|Park on Disabled Space Crosshatch
Vehicles & Parking|22522|CVC|I|Parked Within 3 Feet of Access Ramp
Park & Environmental|62.0606|SDMC|I|Attaching Rope, Wire, Etc. Detrimental Substance Prohibited
Park & Environmental|43.0304|SDMC|M|Illegal Discharge into Storm Drain
Park & Environmental|62.0604|SDMC|I|Removal of Planting Prohibited
Special Regulations|52.5403|SDMC|M|Drones Careless or Reckless / FAA Restriction / Emergency Interference
Special Regulations|63.0201(b)|SDMC|M|Soaring or Gliding Without Permit
Public Safety & Conduct|498(b)(5)|PC|M|Utility Theft: City Electricity Without Permission
Public Safety & Conduct|602(m)|PC|M|Trespass: Entering and Occupying Real Property or Structures
Public Safety & Conduct|602(e)|PC|M|Trespass and Remove Earth, Soil, or Stone from Park
Public Safety & Conduct|602(h)|PC|M|Trespass Fence or Gate by Opening or Destroying
Public Safety & Conduct|602(j)|PC|M|Trespass Land and Injure Property of Owner
Public Safety & Conduct|602(k)(3)|PC|M|Trespass Posted Land by Damaging or Unlocking Gate Lock
Public Safety & Conduct|63.0106(a)|SDMC|I|Skating Prohibited Balboa Park
Park & Environmental|63.0102(c)(1)|SDMC|I|Posting of Handbills Prohibited
Park & Environmental|63.0102(c)(2)|SDMC|I|Loose Animal
Park & Environmental|63.0102(c)(2)(B)|SDMC|I|Dog Leash Exceeds 8 Feet
Park & Environmental|63.0102(e)(1)|SDMC|I|Dog License Required Over 4 Months
Park & Environmental|63.0102(c)(3)|SDMC|I|Fireworks Prohibited
Park & Environmental|63.0102(c)(4)|SDMC|I|Destruction of Plants
Park & Environmental|63.0102(c)(5)|SDMC|I|Defacement of Property
Park & Environmental|63.0102(c)(6)|SDMC|I|Dumping Prohibited
Park & Environmental|63.0102(c)(7)|SDMC|I|Glass Containers Prohibited
Park & Environmental|63.0102(c)(8)|SDMC|I|Littering Prohibited
Park & Environmental|63.0102(c)(9)|SDMC|I|Park Waters
Park & Environmental|63.0102(c)(10)|SDMC|I|Mistreating Animals
Park & Environmental|63.0102(c)(11)|SDMC|I|Fires Prohibited
Park & Environmental|63.0102(c)(12)|SDMC|I|Temporary Structures Prohibited
Park & Environmental|63.0102(c)(13)|SDMC|I|Sales Prohibited
Park & Environmental|63.0102(c)(14)|SDMC|I|Commercial Activity or Service Prohibited
Park & Environmental|63.0102(c)(15)|SDMC|I|Shows Prohibited
Park & Environmental|63.0102(c)(16)|SDMC|I|Indecent Conduct or Threat
Park & Environmental|63.0102(c)(17)|SDMC|I|Sports in Designated Areas Only
Park & Environmental|63.0102(c)(18)|SDMC|I|Disobey Lawful Order or False ID
Park & Environmental|63.0102(c)(19)(1)|SDMC|I|Bicycles Prohibited
Park & Environmental|63.0102(c)(19)(4)|SDMC|I|Motorized Vehicles Prohibited
Park & Environmental|63.0102(c)(20)|SDMC|I|Speeding in Park
Park & Environmental|63.0102(c)(21)|SDMC|I|Parking in Undesignated Area
Park & Environmental|63.0102(c)(22)|SDMC|I|Car Washing Prohibited
Park & Environmental|63.0102(c)(23)|SDMC|I|Oversized Vehicular Traffic
Park & Environmental|63.0102(c)(24)|SDMC|I|Large Groups 50+ People
Park & Environmental|63.0102(c)(24)|SDMC|I|Obstructing Traffic
Park & Environmental|63.0102(c)(26)|SDMC|I|Move or Destroy Park Materials
Park & Environmental|63.1012(c)(27)|SDMC|I|Bridle Trails Equestrian Only
Park & Environmental|63.0102(c)(28)|SDMC|I|Unlawful Use of Valves or Utilities
Public Safety & Conduct|63.20.5(j)|SDMC|I|Household Furniture in Public Coastal
Public Safety & Conduct|56.55|SDMC|I/M|Urination or Defecation
Public Safety & Conduct|22435.2(f)|BPC|M|Shopping Cart with Placard
Public Safety & Conduct|54.0110|SDMC|I|Unauthorized Encroachment
Public Safety & Conduct|66.0402|SDMC|I/M|Unauthorized Collection of Recyclables
Public Safety & Conduct|64.0301(a)|SDMC|M|Discharge of Wastewater
Public Safety & Conduct|63.20.5(b)|SDMC|I|Refuse Receptacle Rummage
Public Safety & Conduct|66.0301|SDMC|I|Tampering with or Removal of Refuse
Public Safety & Conduct|594(b)(2)(a)|PC|M|Vandalism Under $950
Public Safety & Conduct|594(b)(1)|PC|F|Felony Vandalism $950 or More
Public Safety & Conduct|63.07|SDMC|I/M|Torrey Pine Trees Destruction or Injury
Public Safety & Conduct|622|PC|M|Injure, Disfigure, or Destroy Monument, Art, Shade Tree, or Ornamental Plant
Public Safety & Conduct|622.5|PC|M|Injure, Deface, or Destroy Archaeological or Historical Object
Public Safety & Conduct|594.2(a)|PC|M|Possession of Graffiti Tools with Intent
Public Safety & Conduct|56.53(c)|SDMC|M|Public Nudity
Public Safety & Conduct|314|PC|M|Indecent Exposure
Public Safety & Conduct|647(a)|PC|M|Lewd Act in Public
Park & Environmental|44.0103|SDMC|I|Spitting Prohibited
Park & Environmental|374.7(a)|PC|M|Polluting Waterway Within 150 Feet of High Water Mark
Drugs, Alcohol & Tobacco|56.61(a)|SDMC|I/J|Minor Consumption of Alcohol
Drugs, Alcohol & Tobacco|25662(a)|BPC|I/J|Minor in Possession of Alcohol
Drugs, Alcohol & Tobacco|58.04|SDMC|I/J|Minor in Possession of Tobacco
Drugs, Alcohol & Tobacco|594.1(e)(1)|PC|I/J|Minor in Possession of Aerosol Can
Fire & Emergency|53.10(c)|SDMC|M|Discharge Firearms or Explosives Unauthorized
Fire & Emergency|63.08|SDMC|M|Discharge of Firearms Prohibited
Fire & Emergency|63.20.19|SDMC|I|Weapons or Firearms Prohibited
Fire & Emergency|13002(a)|HSC|M|Fire Ignition Source
Park & Environmental|63.0102(e)(2)|SDMC|I|Dog Bite Injury
Park & Environmental|44.0304.1|SDMC|I|Dog Defecation Not Cleaned Up
Park & Environmental|620(a)|SDCC|I|Dog License Required
Park & Environmental|251.1|CCR|M|Harassment of Animals
Park & Environmental|59.5.0502(c)(1)|SDMC|I|Loud Dogs in Permitted Site
Park & Environmental|44.0305(a)|SDMC|I|Wild Animals and Prohibited Species
Park & Environmental|44.0204|SDMC|I|Manure / Animal Excreta Prohibited
Park & Environmental|44.0305(b)(3)(A)|SDMC|I|Boa or Snake Must Be in Cage
Park & Environmental|62.0605|SDMC|I|Fastening Animals to Trees or Other Objects
Public Safety & Conduct|59.5.0502(b)(1)|SDMC|M|Amplification
Public Safety & Conduct|59.5.0502(f)|SDMC|I|Excessive Sound Over 65dB at 10 Feet
Drugs, Alcohol & Tobacco|25620(a)|BPC|I|No Alcohol in Undesignated Area
Drugs, Alcohol & Tobacco|56.56(a)|SDMC|I|Open Container of Alcohol
Drugs, Alcohol & Tobacco|56.54(b)|SDMC|I/M|Consumption of Alcohol
Drugs, Alcohol & Tobacco|23223(a)|CVC|I|Possess Alcohol in Vehicle Driver
Drugs, Alcohol & Tobacco|23224(a)|CVC|I|Possess Alcohol in Vehicle Under 21
Drugs, Alcohol & Tobacco|43.1002(g)|SDMC|I|Smoking or Vaping
Drugs, Alcohol & Tobacco|42.1303|SDMC|I|Smoking or Vaping Marijuana
Drugs, Alcohol & Tobacco|11364|HSC|M|Drug Paraphernalia
Drugs, Alcohol & Tobacco|4140|BPC|M|Syringe
General Enforcement|148(a)|PC|M|Obstruct or Delay
General Enforcement|52.05|SDMC|M|Furnish False Information to Peace Officer
General Enforcement|63.20.13|SDMC|I|Rules to be Followed / Posting
General Enforcement|62.0612|SDMC|I/M|Interference with Employee Prohibited
Vehicles & Parking|23127|CVC|M|Off-Roading Prohibited Where Clearly Marked
Vehicles & Parking|2146(a)|CVC|I|Disobey Official Traffic Sign Wrong Way
Vehicles & Parking|38319|CVC|I/M|Damage Environment While Operating Off-Highway Vehicle
Vehicles & Parking|23103(b)|CVC|M|Reckless Driving in Parking Area
Vehicles & Parking|38301|CVC|I|Operating Vehicle on Lands Not Authorized
Vehicles & Parking|21207.5(a)|CVC|I|Class 3 Bikes Prohibited on Trail
Vehicles & Parking|86.0137(b)|SDMC|I|Repair Vehicle Prohibited
Vehicles & Parking|38320(a)|CVC|I|Littering from Vehicle Likely to Injure Animal or Plant
Vehicles & Parking|22450(a)|CVC|I|Stop Sign Failure to Stop at Limit Line
Vehicles & Parking|141.0612(c)(10)|SDMC|I|Food Trucks Prohibited Coastal
Vehicles & Parking|142.0510(b)|SDMC|I|Parking Spaces to be Kept Clear
Special Regulations|54.0212(b)|SDMC|U|Abandoned Property Unsanitary
Special Regulations|54.0212(a)|SDMC|U|Abandoned Property Sanitary
Park & Environmental|63.0403(a)(1)|SDMC|M|Build or affix structures to trees/vegetation along waterway banks
Park & Environmental|63.0403(a)(2)|SDMC|M|Move rocks, destroy vegetation/paths, or reconfigure waterway landscape
Park & Environmental|63.0403(a)(3)|SDMC|M|Drive, park, or bring vehicle along waterway bank outside designated area
Park & Environmental|63.0403(a)(4)|SDMC|M|Dig on banks of a waterway
Park & Environmental|63.0403(a)(5)|SDMC|M|Discharge or store waste along banks or into waterway
Encampments|63.0404(a)|SDMC|M|Unauthorized camping or encampment on public property
Encampments|63.0404(b)(1)|SDMC|M|Encampment posing immediate threat or unreasonable risk to a person
Encampments|63.0404(b)(2)|SDMC|M|Encampment posing immediate threat or unreasonable risk to public health or safety
Encampments|63.0404(b)(3)|SDMC|M|Encampment disrupting vital government services
Encampments|63.0404(c)(3)|SDMC|M|Camping prohibited in open space, waterway, or waterway banks
Encampments|63.0404(c)(5)|SDMC|M|Camping in designated high-risk park where required signs are posted
Encampments|63.0405(b)|SDMC|U|Enforcement limitation for 63.0404(a): shelter availability and 9:00 PM-5:30 AM restriction
Encampments|63.0405(c)|SDMC|U|63.0403 and 63.0404(b)/(c) enforceable regardless of shelter availability
Beach & Waterfront|63.20.3(a)|SDMC|U|Entering or operating on water contrary to posted warning signals, except rescue
Beach & Waterfront|63.20.3(b)|SDMC|U|Vessel or board in marked swimming area or over 5 MPH within 100 feet
Park & Environmental|63.03|SDMC|U|Use recreation facility without required permit, ticket, or fee
Fire & Emergency|511.0307(a)|SDMC|U|Park fires must comply with SDMC 63.0102(c)(11)
Fire & Emergency|511.0307(c)|SDMC|U|Open burning prohibited during Red Flag Warning or Fire Weather Watch, subject to beach exception

Beach & Waterfront|63.20.16(a)|SDMC|M|Unauthorized vehicle on fishing pier
Beach & Waterfront|63.20.16(b)|SDMC|M|Bicycle or skateboard on fishing pier
Beach & Waterfront|63.20.16(c)|SDMC|M|Diving or jumping from fishing pier
Beach & Waterfront|63.20.16(d)|SDMC|M|Swimming or surfing within 75 feet of fishing pier
Beach & Waterfront|63.20.16(e)|SDMC|M|Climbing on fishing pier railings
Beach & Waterfront|63.20.16(f)|SDMC|M|Unsafe casting on fishing pier
Beach & Waterfront|63.20.16(g)|SDMC|M|Improper fish cleaning on fishing pier
Beach & Waterfront|63.20.16(h)|SDMC|M|Littering on fishing pier
Beach & Waterfront|63.20.16(i)|SDMC|M|More than one fishing line on fishing pier
Beach & Waterfront|63.20.16(j)|SDMC|M|Animal on fishing pier
Beach & Waterfront|63.20.16(k)|SDMC|M|Surf casting within 200 feet of fishing pier
Beach & Waterfront|63.20.16(l)|SDMC|M|Commercial fishing from fishing pier
Beach & Waterfront|63.20.16(m)|SDMC|M|Spear gun on fishing pier
Beach & Waterfront|63.20.16(n)|SDMC|M|Vessel within 100 feet of fishing pier
Beach & Waterfront|63.20.16(o)|SDMC|M|Fire on fishing pier
Beach & Waterfront|63.20.16(p)|SDMC|M|Smoking or vaping on fishing pier
Beach & Waterfront|63.20.16(q)|SDMC|M|Unauthorized sales on fishing pier
Beach & Waterfront|63.20.7(a)|SDMC|U|Motor vehicle prohibited on beach, adjacent sidewalk, or turf except authorized use
Beach & Waterfront|63.20.7(b)|SDMC|U|Permitted vehicle over 5 MPH on beach or adjacent area
Beach & Waterfront|63.20.10(a)|SDMC|U|Block or obstruct designated boat launch area
Beach & Waterfront|63.20.10(b)|SDMC|U|Leave vehicle unattended in designated boat launch area
Beach & Waterfront|63.20.10(c)|SDMC|U|Obstruct boat launch through repeated or extended use
Encampments|63.0404(c)(1)|SDMC|M|Camping within two blocks of school
Encampments|63.0404(c)(2)|SDMC|M|Camping within two blocks of shelter
Encampments|63.0404(c)(4)|SDMC|M|Camping at transit hub, trolley platform, or trolley tracks where posted
Expressive Activity & Vending|63.0503(a)|SDMC|U|Expressive activity footprint exceeds allowed area
Expressive Activity & Vending|63.0503(b)|SDMC|U|Display merchandise on ground or public structures
Expressive Activity & Vending|63.0503(c)|SDMC|U|Obstruct pedestrian or emergency access / reduce usable sidewalk width below 48 inches
Expressive Activity & Vending|63.0503(d)|SDMC|U|Attach expressive activity equipment to public infrastructure
Expressive Activity & Vending|63.0503(e)|SDMC|U|Expressive activity violates applicable sound limits
Expressive Activity & Vending|63.0504(a)|SDMC|U|Use table/easel/chair/umbrella outside designated expressive activity area
Expressive Activity & Vending|63.0504(b)|SDMC|U|Vending prohibited within designated expressive activity area
Expressive Activity & Vending|63.0504(c)|SDMC|U|Buy, sell, reserve, or hold expressive activity space
Expressive Activity & Vending|63.0506(a)|SDMC|U|First administrative citation for expressive activity violation
Expressive Activity & Vending|63.0506(b)|SDMC|U|Second administrative citation within one year
Expressive Activity & Vending|63.0506(c)|SDMC|U|Third or subsequent administrative citation within one year
Fire & Emergency|511.0304|SDMC|U|Dump or deposit waste in Wildland-Urban Interface area or along associated trails/roads
Fire & Emergency|511.0503|SDMC|U|Parking prohibited in signed high-fire-risk area during Red Flag Warning or Fire Weather Watch
Reference Only|59.5.0402|SDMC|U|Excessive off-highway motor vehicle noise`;

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
  "PC 242": "Battery is any willful and unlawful use of force or violence upon another person.",

  "SDMC 63.0403(a)(1)": "Current City code prohibits building or erecting structures along waterway banks, driving objects into trees or natural vegetation to build an encampment or structure, or affixing objects to trees or natural vegetation.",
  "SDMC 63.0403(a)(2)": "Current City code prohibits moving boulders or large rocks, destroying vegetation or City-created paths, or otherwise reconfiguring the natural landscape in or along a waterway.",
  "SDMC 63.0403(a)(3)": "Current City code prohibits driving, parking, or bringing a vehicle along waterway banks except in areas specifically provided and designated for vehicular use.",
  "SDMC 63.0403(a)(4)": "Current City code prohibits digging on the banks of a waterway.",
  "SDMC 63.0403(a)(5)": "Current City code prohibits discharging or storing waste, including garbage, refuse, and human or animal waste, along waterway banks or into the water.",
  "SDMC 63.0404(a)": "Current City code prohibits camping or maintaining an encampment on public property unless specifically authorized by the City Manager. Enforcement under this subsection is subject to section 63.0405(b).",
  "SDMC 63.0404(b)(1)": "Camping or maintaining an encampment is prohibited when it poses an immediate threat or unreasonable risk of harm to a person.",
  "SDMC 63.0404(b)(2)": "Camping or maintaining an encampment is prohibited when it poses an immediate threat or unreasonable risk of harm to public health or safety.",
  "SDMC 63.0404(b)(3)": "Camping or maintaining an encampment is prohibited when it disrupts vital government services.",
  "SDMC 63.0404(c)(3)": "Camping or maintaining an encampment is prohibited at all times in open space, waterways, and the banks of waterways.",
  "SDMC 63.0404(c)(5)": "Camping or maintaining an encampment is prohibited in a park that the City Manager has determined presents a substantial public health and safety risk when the required signs are posted.",
  "SDMC 63.0405(b)": "For section 63.0404(a), officers shall not issue a criminal citation between 9:00 p.m. and 5:30 a.m. or when no reasonably available shelter exists for the person, considering disability and other specific circumstances.",
  "SDMC 63.0405(c)": "Sections 63.0403 and 63.0404(b) and (c) are enforceable at all times regardless of shelter availability.",
  "SDMC 63.20.3(a)": "It is unlawful to bathe, swim, surf, row, canoe, or operate specified watercraft where warning signals have been placed on the water or adjacent beach, except for rescue.",
  "SDMC 63.20.3(b)": "It is unlawful to operate a vessel, windsurfer, sailboard, or similar device in a marked swimming area, or within 100 feet of it at more than five miles per hour.",
  "SDMC 63.03": "It is unlawful to use a municipal recreation facility for which a fee, ticket, or permit has been established without first obtaining the required authorization or paying the required fee.",
  "SDMC 511.0307(a)": "The current San Diego Fire Code provides that fires are not permitted in public parks except as allowed by SDMC section 63.0102(c)(11).",
  "SDMC 511.0307(c)": "The current San Diego Fire Code prohibits open burning, recreational fires, and portable outdoor fireplace fires during a Red Flag Warning or Fire Weather Watch, subject to the specified beach-area exception.",
  "SDMC 63.20.16(a)": "Fishing pier regulations prohibit unauthorized vehicles on fishing piers.",
  "SDMC 63.20.16(b)": "Fishing pier regulations prohibit bicycles and skateboards on fishing piers.",
  "SDMC 63.20.16(c)": "Fishing pier regulations prohibit diving or jumping from fishing piers.",
  "SDMC 63.20.16(d)": "Fishing pier regulations prohibit swimming or surfing within 75 feet of a fishing pier.",
  "SDMC 63.20.16(e)": "Fishing pier regulations prohibit climbing on pier railings.",
  "SDMC 63.20.16(f)": "Fishing pier regulations prohibit casting in a manner that endangers other persons.",
  "SDMC 63.20.16(g)": "Fishing pier regulations restrict fish cleaning to designated areas or methods.",
  "SDMC 63.20.16(h)": "Fishing pier regulations prohibit littering.",
  "SDMC 63.20.16(i)": "Fishing pier regulations prohibit using more than one fishing line.",
  "SDMC 63.20.16(j)": "Fishing pier regulations prohibit animals on fishing piers except as otherwise authorized by law.",
  "SDMC 63.20.16(k)": "Fishing pier regulations prohibit surf casting within 200 feet of a fishing pier.",
  "SDMC 63.20.16(l)": "Fishing pier regulations prohibit commercial fishing from fishing piers.",
  "SDMC 63.20.16(m)": "Fishing pier regulations prohibit spear guns.",
  "SDMC 63.20.16(n)": "Fishing pier regulations restrict vessels from approaching within 100 feet of a fishing pier.",
  "SDMC 63.20.16(o)": "Fishing pier regulations prohibit fires.",
  "SDMC 63.20.16(p)": "Fishing pier regulations prohibit smoking or vaping.",
  "SDMC 63.20.16(q)": "Fishing pier regulations prohibit unauthorized sales.",
  "SDMC 63.20.7(a)": "Motor vehicles are generally prohibited on beaches, adjacent sidewalks, and turf except for authorized uses.",
  "SDMC 63.20.7(b)": "Authorized vehicles in these areas are limited to five miles per hour.",
  "SDMC 63.20.10(a)": "Boat launch regulations prohibit blocking or obstructing designated launch areas.",
  "SDMC 63.20.10(b)": "Vehicles may not be left unattended in designated boat launch areas.",
  "SDMC 63.20.10(c)": "Repeated or extended use that obstructs the boat launch is prohibited; the code requires a verbal warning before a notice of violation is issued for this subsection.",
  "SDMC 63.0404(c)(1)": "Camping or maintaining an encampment is prohibited within two blocks of a school, subject to the ordinance location requirements.",
  "SDMC 63.0404(c)(2)": "Camping or maintaining an encampment is prohibited within two blocks of a shelter, subject to the ordinance location requirements.",
  "SDMC 63.0404(c)(4)": "Camping or maintaining an encampment is prohibited at specified transit hubs, trolley platforms, and tracks when required signs are posted.",
  "SDMC 63.0503(a)": "Expressive activity must remain within the footprint allowed by the ordinance.",
  "SDMC 63.0503(b)": "The ordinance restricts displaying merchandise directly on the ground or on public structures.",
  "SDMC 63.0503(c)": "Expressive activity may not obstruct pedestrian or emergency access or reduce usable sidewalk width below the required minimum.",
  "SDMC 63.0503(d)": "Expressive activity equipment may not be attached to public infrastructure.",
  "SDMC 63.0503(e)": "Expressive activity remains subject to applicable sound limits.",
  "SDMC 63.0504(a)": "In designated expressive activity areas, tables, easels, chairs, umbrellas, and similar equipment must remain within the designated area.",
  "SDMC 63.0504(b)": "Vending is prohibited within designated expressive activity areas.",
  "SDMC 63.0504(c)": "Expressive activity spaces may not be bought, sold, held, or reserved.",
  "SDMC 63.0506(a)": "The ordinance provides a $100 administrative citation for a first violation.",
  "SDMC 63.0506(b)": "The ordinance provides a $200 administrative citation for a second violation within one year.",
  "SDMC 63.0506(c)": "The ordinance provides a $500 administrative citation for a third or subsequent violation within one year.",
  "SDMC 511.0304": "The current fire code prohibits dumping or depositing waste in Wildland-Urban Interface areas and along associated trails, roads, highways, or structures.",
  "SDMC 511.0503": "During Red Flag Warnings or Fire Weather Watches, parking may be prohibited in signed high-fire-risk areas when necessary to preserve access and evacuation routes.",
  "SDMC 59.5.0402": "This section regulates excessive noise from motor vehicles operating off public streets. Technical noise measurement standards apply.",
};

const INFO: Array<[string, string]> = [
  ["About", "Fast field reference for CVC, PC, HSC, BPC, SDMC, CCR, SDCC, UFC, and TOW entries."],
  ["Features", "Search by section, code, title, level, or category. Current SDMC park, waterway, encampment, water-safety, and fire-reference entries include links to the City's EncodePlus code portal. The date page calculates an appearance date 8 weeks out and moves it to the next court day when needed."],
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

const LOCAL_SOURCE_URLS: Record<string, string> = {
  "63.0403": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?tocid=002.006.003.006",
  "63.0404": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?tocid=002.006.003.006",
  "63.0405": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?tocid=002.006.003.006",
  "63.20.3": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=5063",
  "63.03": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=5052",
  "511.0307": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=2932",
  "63.20.16": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=5076",
  "63.20.7": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=5067",
  "63.20.10": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=5070",
  "63.0503": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=5192",
  "63.0504": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=5193",
  "63.0506": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=5195",
  "511.0304": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=2921",
  "511.0503": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=2940",
  "59.5.0402": "https://online.encodeplus.com/regs/sandiego-ca/doc-viewer.aspx?secid=2820",
};

const ENFORCEMENT_NOTES: Record<string, string> = {
  "63.20.10(c)": "A verbal warning is required before issuing a notice of violation for this subsection.",
  "63.0404(c)(1)": "Enforceable regardless of shelter availability under SDMC 63.0405(c).",
  "63.0404(c)(2)": "Enforceable regardless of shelter availability under SDMC 63.0405(c).",
  "63.0404(c)(4)": "Enforceable regardless of shelter availability under SDMC 63.0405(c). Posted-sign conditions may apply.",
  "63.0506(a)": "Administrative citation schedule: first violation is $100.",
  "63.0506(b)": "Administrative citation schedule: second violation within one year is $200.",
  "63.0506(c)": "Administrative citation schedule: third or subsequent violation within one year is $500.",
  "511.0503": "Applies only in signed high-fire-risk areas during a Red Flag Warning or Fire Weather Watch when parking restrictions are in effect.",
  "59.5.0402": "Reference-only: enforcement depends on applicable noise measurement standards and procedures."
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
  if (item.code === "SDMC") {
    const baseSection = item.section.match(/^\d+(?:\.\d+)*/)?.[0] || item.section;
    return LOCAL_SOURCE_URLS[baseSection] || "https://online.encodeplus.com/regs/sandiego-ca/index.aspx";
  }

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
  console.assert(filterCitations("63.20.16", "all", "M", false, []).length >= 10, "Fishing pier entries missing");
  console.assert(filterCitations("63.20.10(c)", "all", "U", false, []).length > 0, "Boat launch entry missing");
  console.assert(ENFORCEMENT_NOTES["63.20.10(c)"].includes("verbal warning"), "Boat launch warning note missing");
  console.assert(filterCitations("63.0504", "all", "U", false, []).length > 0, "Expressive activity entries missing");
  console.assert(filterCitations("511.0503", "all", "U", false, []).length > 0, "Red Flag parking entry missing");
}
runTests();

function Badge({ level, children }: { level?: Level; children: React.ReactNode }) {
  const className = level ? LEVEL_CLASS[level] : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${className}`}>
      {children}
    </span>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active
        ? "rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
        : "rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"}
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
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge>{item.category}</Badge>
            <Badge level={item.level}>{LEVEL_LABEL[item.level]}</Badge>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-slate-700 sm:text-xl">{item.title}</h2>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-500 sm:text-base">
            {item.section} {item.code} [{item.level}]
          </p>
        </button>

        <div className="grid grid-cols-2 gap-2 md:flex">
          <button type="button" onClick={onFavorite} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            {saved ? "Unsave" : "Save"}
          </button>
          <button type="button" onClick={onSelect} className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
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

        {ENFORCEMENT_NOTES[item.section] && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-semibold text-amber-900">Enforcement note</h3>
            <p className="mt-2 text-amber-900">{ENFORCEMENT_NOTES[item.section]}</p>
          </div>
        )}

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


function SubjectIdentificationReference() {
  const [notes, setNotes] = useState({
    location: "",
    age: "",
    height: "",
    build: "",
    hair: "",
    facialHair: "",
    top: "",
    bottom: "",
    shoes: "",
    distinguishing: "",
    carried: "",
    actions: "",
    direction: ""
  });

  const update = (field: keyof typeof notes, value: string) =>
    setNotes((current) => ({ ...current, [field]: value }));

  const parts = [
    notes.age && `${notes.age}`,
    notes.height && `${notes.height}`,
    notes.build && `${notes.build} build`,
    notes.hair && `${notes.hair} hair`,
    notes.facialHair && notes.facialHair,
    notes.top && `top: ${notes.top}`,
    notes.bottom && `bottom: ${notes.bottom}`,
    notes.shoes && `shoes: ${notes.shoes}`,
    notes.distinguishing && `distinguishing: ${notes.distinguishing}`,
    notes.carried && `carrying: ${notes.carried}`,
    notes.actions && `last seen: ${notes.actions}`,
    notes.direction && `direction: ${notes.direction}`,
    notes.location && `location: ${notes.location}`
  ].filter(Boolean);

  const broadcast = parts.join(", ");

  const fields: Array<[keyof typeof notes, string, string]> = [
    ["location", "Location / time", "Trail, lot, landmark, time"],
    ["age", "Approx. age", "Example: 30s"],
    ["height", "Approx. height", "Example: 5'10"],
    ["build", "Build", "Slim, medium, stocky, athletic"],
    ["hair", "Hair", "Color, length, style"],
    ["facialHair", "Facial hair", "Beard, mustache, clean-shaven"],
    ["top", "Upper clothing", "Color + garment + markings"],
    ["bottom", "Lower clothing", "Color + garment"],
    ["shoes", "Shoes", "Type and color"],
    ["distinguishing", "Distinctive features", "Tattoo location, scar, hat, glasses"],
    ["carried", "Items carried", "Backpack, bag, bicycle, tools"],
    ["actions", "Observed actions", "What you actually saw"],
    ["direction", "Direction / travel", "Northbound, toward visitor center, on foot"]
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Field reference</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Quick Subject Identification</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Build a fast, observable description from head to toe. Prioritize what another ranger or dispatcher could use to locate the same person.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">30-second scan</h3>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="font-semibold text-slate-900">1. Where?</p>
              <p className="mt-1 text-slate-600">Exact location, landmark, direction of travel, and mode of travel.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">2. Overall profile</p>
              <p className="mt-1 text-slate-600">Approximate age, height, and build. Use estimates only when useful.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">3. Head</p>
              <p className="mt-1 text-slate-600">Hair, facial hair, hat, glasses, or other clearly visible features.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">4. Clothing</p>
              <p className="mt-1 text-slate-600">Start with color, then garment type, then logos or unusual markings.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">5. Distinguishing details</p>
              <p className="mt-1 text-slate-600">Visible tattoos, scars, unique footwear, bags, equipment, bicycle, or other items.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">6. Actions</p>
              <p className="mt-1 text-slate-600">Describe conduct you directly observed instead of conclusions about intent.</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Avoid guessing ethnicity, nationality, religion, medical status, or other personal background. Record observable facts and follow agency policy for any required demographic fields.
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Description builder</h3>
              <p className="mt-1 text-sm text-slate-500">Fill only what you know. Leave uncertain fields blank.</p>
            </div>
            <button
              type="button"
              onClick={() => setNotes({
                location: "", age: "", height: "", build: "", hair: "", facialHair: "",
                top: "", bottom: "", shoes: "", distinguishing: "", carried: "", actions: "", direction: ""
              })}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {fields.map(([field, label, placeholder]) => (
              <label key={field} className={field === "actions" || field === "location" ? "sm:col-span-2" : ""}>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                <input
                  value={notes[field]}
                  onChange={(event) => update(field, event.target.value)}
                  placeholder={placeholder}
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Quick broadcast</p>
        <h3 className="mt-1 text-lg font-bold">Description summary</h3>
        {broadcast ? (
          <p className="mt-3 rounded-xl bg-slate-50 p-4 font-medium leading-relaxed text-slate-800">
            {broadcast}
          </p>
        ) : (
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            Add details above to build a concise description.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold">What matters most</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Location", "Where the person is or was last seen."],
            ["Clothing", "Colors and garment types are often the fastest identifiers."],
            ["Direction", "Where they are going and whether they are walking, biking, or driving."],
            ["Unique feature", "One memorable item or feature can separate similar descriptions."]
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function AlphabetReference() {
  const [alphabetQuery, setAlphabetQuery] = useState("");

  const rows = useMemo(() => {
    const q = alphabetQuery.trim().toLowerCase();
    if (!q) return SDPD_PHONETIC_ALPHABET;
    return SDPD_PHONETIC_ALPHABET.filter(([letter, word]) =>
      `${letter} ${word}`.toLowerCase().includes(q)
    );
  }, [alphabetQuery]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Radio reference</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Law Enforcement Phonetic Alphabet</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Quick A–Z reference for the law-enforcement phonetic alphabet used in San Diego public-safety communications.
        </p>

        <input
          value={alphabetQuery}
          onChange={(event) => setAlphabetQuery(event.target.value)}
          placeholder="Search letter or word..."
          className="mt-4 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {rows.map(([letter, word]) => (
          <div
            key={letter}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black tracking-tight text-slate-900">{letter}</span>
              <span className="text-base font-semibold text-slate-700">{word}</span>
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          No matching letter or phonetic word found.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        This uses the traditional law-enforcement phonetic alphabet: Adam, Boy, Charles, David, Edward, Frank, George, Henry, Ida, John, King, Lincoln, Mary, Nora, Ocean, Paul, Queen, Robert, Sam, Tom, Union, Victor, William, X-Ray, Young, Zebra.
      </div>
    </section>
  );
}

function BeatFinder() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<BeatResult | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const resolvePoint = async (
    lat: number,
    lon: number,
    matchedAddress: string,
    accuracy?: number,
    geocodeScore?: number
  ) => {
    const properties = await findBeatAtPoint(lat, lon);

    if (!properties) {
      setResult(null);
      setStatus("This point did not fall inside a City of San Diego SDPD beat boundary.");
      return;
    }

    setResult(normalizeBeatResult(properties, {
      lat,
      lon,
      address: matchedAddress,
      accuracy,
      geocodeScore
    }));
    setStatus("");
  };

  const searchAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = address.trim();

    if (!trimmed) {
      setStatus("Enter an address or intersection.");
      setResult(null);
      return;
    }

    setLoading(true);
    setStatus("Locating address and checking the current beat boundary...");

    try {
      const location = await geocodeAddress(trimmed);
      await resolvePoint(location.lat, location.lon, location.address, undefined, location.score);
    } catch (error) {
      setResult(null);
      setStatus(error instanceof Error ? error.message : "Unable to determine the beat.");
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus("This browser does not support location services.");
      return;
    }

    setLoading(true);
    setResult(null);
    setStatus("Requesting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          setStatus("Checking the current beat boundary...");
          const matchedAddress = await reverseGeocode(latitude, longitude);
          setAddress(matchedAddress);
          await resolvePoint(latitude, longitude, matchedAddress, accuracy);
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Unable to determine the beat.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        setStatus(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Enter an address instead."
            : "Your location could not be determined. Enter an address instead."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Location tool</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Likely SDPD Beat</h2>
            <p className="mt-2 max-w-3xl text-slate-600">
              Enter a San Diego address or use your phone location. The point is checked against the City's current SDPD police-beat GIS boundaries through this site's server.
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Current GIS
          </span>
        </div>

        <form onSubmit={searchAddress} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Address or intersection</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Example: 1 Father Junipero Serra Trail"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Checking..." : "Find beat"}
            </button>
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={loading}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use my location
            </button>
          </div>
        </form>

        {status && (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600" aria-live="polite">
            {status}
          </p>
        )}
      </div>

      {result && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Likely police beat</p>
            <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className="text-4xl font-bold tracking-tight">{result.beat}</span>
              <span className="pb-1 text-lg text-slate-200">{result.neighborhood}</span>
            </div>
          </div>

          <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
            <div className="bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Service area</p>
              <p className="mt-1 text-lg font-semibold">{result.serviceArea}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Division</p>
              <p className="mt-1 text-lg font-semibold">{result.division}</p>
            </div>
          </div>

          <div className="space-y-3 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Matched location</p>
              <p className="mt-1 font-medium text-slate-800">{result.address}</p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {typeof result.accuracy === "number" && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Phone accuracy ±{Math.round(result.accuracy)} m
                </span>
              )}
              {typeof result.geocodeScore === "number" && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Address match {Math.round(result.geocodeScore)}%
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                {result.lat.toFixed(5)}, {result.lon.toFixed(5)}
              </span>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Treat this as a likely beat for field reference. Confirm with current CAD/dispatch or departmental mapping when the exact beat is operationally important, especially near a boundary.
            </div>

          </div>
        </div>
      )}
    </section>
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold">San Diego Radio Codes</h2>
        <p className="mt-2 text-slate-700">
          Quick-reference scanner terminology and SDPD unit designators organized by type. Search a code such as 10-97, 11-99, Code 4, 831J1, J, PT, or a plain-language meaning.
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
        <section key={group} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          No matching radio code found.
        </div>
      )}
    </section>
  );
}

function DateCalculator({ issuedAt, onChange }: { issuedAt: string; onChange: (value: string) => void }) {
  const result = useMemo(() => calculateAppearance(issuedAt), [issuedAt]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Field Reference</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Enforcement Citation Lookup</h1>
              <p className="mt-1 hidden max-w-3xl text-sm text-slate-600 sm:block sm:text-base">
                Fast reference for common enforcement codes, radio codes, and appearance-date calculations.
              </p>
            </div>
            <div className="hidden w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Field reference
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
            <TabButton active={page === "lookup"} onClick={() => setPage("lookup")}>Lookup</TabButton>
            <TabButton active={page === "radio"} onClick={() => setPage("radio")}>Radio</TabButton>
            <TabButton active={page === "alphabet"} onClick={() => setPage("alphabet")}>Alphabet</TabButton>
            <TabButton active={page === "subject"} onClick={() => setPage("subject")}>Subject ID</TabButton>
            <TabButton active={page === "beat"} onClick={() => setPage("beat")}>Beat</TabButton>
            <TabButton active={page === "date"} onClick={() => setPage("date")}>Date</TabButton>
            <TabButton active={page === "favorites"} onClick={() => setPage("favorites")}>
              Favorites{favorites.length ? ` ${favorites.length}` : ""}
            </TabButton>
            <TabButton active={page === "info"} onClick={() => setPage("info")}>Info</TabButton>
          </nav>

          {(page === "lookup" || page === "favorites") && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search citations..."
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 sm:h-12 sm:px-4"
                />
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen((open) => !open)}
                  className="h-11 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100 sm:hidden"
                >
                  {mobileFiltersOpen ? "Hide" : "Filters"}
                </button>
              </div>

              <div className={`${mobileFiltersOpen ? "grid" : "hidden"} mt-2 gap-2 sm:grid sm:grid-cols-3 sm:gap-3`}>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 sm:h-12"
                >
                  {CATEGORIES.map((value) => (
                    <option key={value} value={value}>
                      {value === "all" ? "All categories" : value}
                    </option>
                  ))}
                </select>

                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 sm:h-12"
                >
                  <option value="all">All levels</option>
                  {(Object.keys(LEVEL_LABEL) as Level[]).map((value) => (
                    <option key={value} value={value}>{LEVEL_LABEL[value]}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100 sm:h-12"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 pb-24 sm:px-6">
        {page === "radio" && <RadioCodesReference />}

        {page === "alphabet" && <AlphabetReference />}

        {page === "subject" && <SubjectIdentificationReference />}

        {page === "beat" && <BeatFinder />}

        {page === "date" && <DateCalculator issuedAt={issuedAt} onChange={setIssuedAt} />}

        {page === "info" && INFO.map(([title, body]) => (
          <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-slate-700">{body}</p>
          </section>
        ))}

        {(page === "lookup" || page === "favorites") && (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {page === "favorites" ? "Saved reference" : "Citation library"}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">
                {page === "favorites" ? "Favorites" : "Browse citations"}
              </h2>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{shown.length} results</p>
                <p className="mt-0.5 text-xs text-slate-500">{CITATIONS.length} total citations in the reference.</p>
              </div>
              <p className="text-xs font-medium text-slate-500">Select a violation to view details</p>
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
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                No matching citation found.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
