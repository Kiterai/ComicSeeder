use std::{env, time::Duration};

use actix_files::NamedFile;
use actix_identity::IdentityMiddleware;
use actix_session::SessionMiddleware;
use actix_web::{
    cookie::Key, dev::{fn_service, ServiceRequest, ServiceResponse}, middleware::Logger, web, App, HttpServer
};
use comicseeder_backend::{
    db::{establish_database_pool, establish_session_db},
    id, works,
};
use dotenv::dotenv;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let host_self = env::var("HOST").expect("HOST must be set");
    let port_self = env::var("PORT")
        .expect("PORT must be set")
        .parse::<u16>()
        .expect("PORT must be a valid unsigned 16-bit integer");

    let pool = establish_database_pool().await;
    println!("Connected to database");

    let secret_key = Key::generate();
    let redis_store = establish_session_db().await;
    println!("Connected to session db");

    HttpServer::new(move || {
        let identity_middleware = IdentityMiddleware::builder()
            .login_deadline(Some(Duration::new(3600 * 3, 0)))
            .build();

        let session_middleware = SessionMiddleware::new(redis_store.clone(), secret_key.clone());

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(Logger::default())
            .wrap(identity_middleware)
            .wrap(session_middleware)
            .service(
                web::scope("/api/v1")
                    .service(works::get_work)
                    .service(works::create_work)
                    .service(works::update_work)
                    .service(works::delete_work)
                    .service(id::login)
                    .service(id::logout)
                    .service(id::signup)
                    .service(id::verification),
            )
            .service(
                actix_files::Files::new("/", "../comicseeder-front/dist")
                    .index_file("index.html")
                    .default_handler(fn_service(|req: ServiceRequest| async {
                        let (http_req, _payload) = req.into_parts();
                        let response = NamedFile::open_async("../comicseeder-front/dist/index.html")
                            .await?
                            .into_response(&http_req);
                        Ok(ServiceResponse::new(http_req, response))
                    })),
            )
    })
    .bind((host_self, port_self))?
    .run()
    .await
}
