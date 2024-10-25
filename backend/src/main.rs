use actix_web::{delete, get, patch, post, web, App, HttpResponse, HttpServer, Responder};

#[post("/works")]
async fn create_work() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[get("/works/{id}")]
async fn get_work() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[patch("/works/{id}")]
async fn update_work() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[delete("/works/{id}")]
async fn delete_work() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[post("/login")]
async fn login() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[get("/logout")]
async fn logout() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[post("/signup")]
async fn signup() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(
                web::scope("/api/v1")
                    .service(get_work)
                    .service(create_work)
                    .service(update_work)
                    .service(delete_work)
                    .service(login)
                    .service(logout)
                    .service(signup)
            )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
