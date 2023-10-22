// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterGN",
    products: [
        .library(name: "TreeSitterGN", targets: ["TreeSitterGN"]),
    ],
    dependencies: [],
    targets: [
        .target(name: "TreeSitterGN",
                path: ".",
                exclude: [
                    "binding.gyp",
                    "bindings",
                    "Cargo.toml",
                    "corpus",
                    "grammar.js",
                    "LICENSE",
                    "package.json",
                    "README.md",
                ],
                sources: [
                    "src/parser.c",
                    "src/scanner.c",
                ],
                resources: [
                    .copy("queries")
                ],
                publicHeadersPath: "bindings/swift",
                cSettings: [.headerSearchPath("src")])
    ]
)
