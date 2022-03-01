import 'dotenv/config';
import Server from '../server/index';

const port = process.env.PORT || 3000;

Server.listen(port);

console.log(`Server is running on port ${port}`);