import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { latitude, longitude } = await req.json();

        if (!latitude || !longitude) {
            return NextResponse.json({ message: 'Latitude and longitude are required' }, { status: 400 });
        }

        const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${latitude},${longitude}&api_key=${process.env.NEXT_PUBLIC_API_KEY}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        let address;

        if (!data.results)
            return NextResponse.json({ message: 'Unable to find address' }, { status: 404 });

        if (data.results.length < 3) {
            address = data.results[0].formatted_address;
        }
        else {
            address = data.results[2].formatted_address;
        }
        console.log('Address:', address);
        return NextResponse.json({ address }, { status: 200 });
    } catch (error) {
        console.error('Error fetching address:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}